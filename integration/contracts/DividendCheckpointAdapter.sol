pragma solidity ^0.4.24;

interface IEtherDividendCheckpoint {

  /**
    * @notice Creates a dividend and checkpoint for the dividend, using global list of excluded addresses
    * @param _maturity Time from which dividend can be paid
    * @param _expiry Time until dividend can no longer be paid, and can be reclaimed by issuer
    * @param _name Name/title for identification
    */
  function createDividend(uint256 _maturity, uint256 _expiry, bytes32 _name) external payable;
}

contract DividendCheckpointAdapter {

  address public authorizedPayer;
  address public dividendCheckpoint;


  modifier onlyAuthorizedPayer {
    require(msg.sender == authorizedPayer, "DividendCheckpointAdapter.onlyAuthorizedPayer: unauthorized sender.");
    _;
  }

  constructor(address _authorizedPayer, address _dividendCheckpoint) public {
    authorizedPayer = _authorizedPayer;
    dividendCheckpoint = _dividendCheckpoint;
  }

  function () public payable onlyAuthorizedPayer {
    IEtherDividendCheckpoint(dividendCheckpoint).createDividend.value(msg.value)(
      block.timestamp, ~uint256(0), "Dividend Payment"
    );
  }
}
