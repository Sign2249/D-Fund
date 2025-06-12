// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./FundStorage.sol";
import "./ProjectManager.sol";
import "./FundLogic.sol";

contract DFund is FundStorage, ProjectManager, FundLogic {
    // 통합 컨트랙트. 각 기능은 모듈별로 관리됨
}
