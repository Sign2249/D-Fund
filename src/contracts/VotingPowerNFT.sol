// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract VotingPowerNFT is ERC721Enumerable, ERC721URIStorage, Ownable {
    uint public nextTokenId;
    address public dFund;

    mapping(uint => mapping(address => uint)) public votingPower;

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
        uint power = sqrt(amountWei);
        votingPower[projectId][donor] += power;

        uint tokenId = nextTokenId++;
        _safeMint(donor, tokenId);
        _setTokenURI(tokenId, "ipfs://example_metadata");

        return tokenId;
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

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    )
        internal
        override(ERC721, ERC721Enumerable)
    {
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

    // ✅ 여기서 ERC721 제거
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
