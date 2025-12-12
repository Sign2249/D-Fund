// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract VotingPowerNFT is ERC721Enumerable, ERC721URIStorage, Ownable {
    // ✅ 1부터 시작 (지갑/뷰어에서 tokenId=0 표시 이슈 방지)
    uint public nextTokenId = 1;
    address public dFund;

    // 총 후원액: projectId => donor => amount
    mapping(uint => mapping(address => uint)) public donorTotalAmount;
    // 1인 1NFT: projectId => donor => tokenId
    mapping(uint => mapping(address => uint)) public donorTokenId;
    mapping(uint => uint[]) public projectTokenIds;

    event VotingNFTMinted(uint indexed projectId, address indexed donor, uint tokenId, uint amountWei);
    event VotingPowerUpdated(uint indexed projectId, address indexed donor, uint totalAmountWei);

    constructor() ERC721("D-Fund Voting NFT", "DFUND-VOTE") {}

    modifier onlyDFund() {
        require(msg.sender == dFund, "Not authorized");
        _;
    }

    function setDFund(address _dFund) external onlyOwner {
        require(dFund == address(0), "Already set");
        dFund = _dFund;
    }

    function mintVotingNFT(
        uint projectId,
        address donor,
        uint amountWei
    ) external onlyDFund returns (uint) {
        // 총액 누적은 항상 수행
        donorTotalAmount[projectId][donor] += amountWei;
        emit VotingPowerUpdated(projectId, donor, donorTotalAmount[projectId][donor]);

        uint tokenId = donorTokenId[projectId][donor];

        // 이미 보유: 재민트 금지, tokenId만 반환
        if (tokenId != 0) {
            return tokenId;
        }

        // 신규 민트: tokenId 1부터 증가
        tokenId = nextTokenId++;
        donorTokenId[projectId][donor] = tokenId;

        _safeMint(donor, tokenId);
        _setTokenURI(tokenId, "ipfs://example_metadata");

        projectTokenIds[projectId].push(tokenId);


        emit VotingNFTMinted(projectId, donor, tokenId, amountWei);
        return tokenId;
    }

    function getProjectTokenIds(uint projectId) external view returns (uint[] memory) {
        return projectTokenIds[projectId];
    }

    function getVotingPower(uint projectId, address donor) external view returns (uint) {
        return sqrt(donorTotalAmount[projectId][donor]);
    }

    function sqrt(uint x) internal pure returns (uint y) {
        if (x == 0) return 0;
        uint z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }

    // --- Overrides ---
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    )
        internal
        override(ERC721, ERC721Enumerable)
    {
        require(from == address(0) || to == address(0), "Err: SBT is non-transferable");
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
