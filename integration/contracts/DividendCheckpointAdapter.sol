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

  address public authorizedPayee;
  address public dividendCheckpoint;


  modifier onlyAuthorizedPayee {
    require(msg.sender == authorizedPayee, "DividendCheckpointAdapter.onlyAuthorizedPayee: unauthorized sender.");
    _;
  }

  constructor(address _authorizedPayee, address _dividendCheckpoint) public {
    authorizedPayee = _authorizedPayee;
    dividendCheckpoint = _dividendCheckpoint;
  }

  function () public payable onlyAuthorizedPayee {
    IEtherDividendCheckpoint(dividendCheckpoint).createDividend.value(msg.value)(
      block.timestamp, ~uint256(0), "Dividend Payment"
    );
  }
}
