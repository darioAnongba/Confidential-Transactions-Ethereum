pragma solidity ^0.4.22;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/lifecycle/Destructible.sol";

contract Organization is Destructible {
  using SafeMath for uint;

  /* --- Structures and variables --- */
  struct Event {
    string name;
    uint openingTime;
    uint closingTime;
    mapping (address => bool) merchants;
    mapping (address => bool) allowedToRegister;
  }

  string public name;
  Event[] public events;

  /* --- Events --- */
  event EventAction(uint id, bool isRegistered);
  event ApprovalAction(address merchant, bool isApproved);
  event MerchantAction(address merchant, bool isRegistered);

  /* --- Modifiers --- */

  /**
  * @dev Reverts if not in event time range.
  */
  modifier isInRange(uint _eventID) {
    require(_eventID < events.length);
    _;
  }

  /**
  * @dev Reverts if event is not open
  */
  modifier onlyWhileOpen(uint _eventID) {
    Event storage mEvent = events[_eventID];
    require(now >= mEvent.openingTime && now <= mEvent.closingTime || mEvent.closingTime == 0);
    _;
  }

  /**
   * @dev Throws if called by any account other than the owner.
   */
  modifier onlyOwnerOrOrigin() {
    // TODO: modify to require(msg.sender == consortium.address && tx.origin == owner) once this is in production
    require(msg.sender == owner || tx.origin == owner);
    _;
  }

  /* --- Public functions --- */

  /**
   * Organization constructor
   */
  constructor(string _name) public {
    name = _name;
  }

  /**
   * Registers a new Event
   * @param _name uint Event name
   * @param _openingTime uint Event Opening time
   * @param _closingTime uint Event Closing time, can be 0 if event is continuous
   * @return An uint specifying the event ID
   */
  function registerEvent(string _name, uint _openingTime, uint _closingTime) onlyOwner public returns(uint id) {
    require(_openingTime >= now);
    require(_closingTime >= _openingTime || _closingTime == 0); // Closing time is 0 if the event is continuous

    id = events.length++;
    events[id] = Event(_name, _openingTime, _closingTime);
    emit EventAction(id, true);
  }

  /**
   * Removes an event
   * @param _eventID uint Event ID to delete
   * @return A boolean specifying if the event has been deleted
   */
  function removeEvent(uint _eventID) onlyOwner isInRange(_eventID) public returns(bool) {
    for (uint i = _eventID; i < events.length-1; i++){
        events[i] = events[i+1];
    }

    delete events[events.length-1];
    events.length--;
    emit EventAction(_eventID, false);
    return true;
  }

  /**
   * @dev Approve the merchant's to be added to the specified event.
   * @param _eventID uint Event ID
   */
  function approveRegistration(uint _eventID) isInRange(_eventID) public returns (bool) {
    Event storage mEvent = events[_eventID];
    mEvent.allowedToRegister[msg.sender] = true;
    emit ApprovalAction(msg.sender, true);
    return true;
  }

  /**
   * @dev Removes the approval of a merchant to be added to this event.
   * @param _eventID uint Event ID
   */
  function removeRegistrationApproval(uint _eventID) isInRange(_eventID) public returns (bool) {
    Event storage mEvent = events[_eventID];
    mEvent.allowedToRegister[msg.sender] = false;
    emit ApprovalAction(msg.sender, false);
    return true;
  }

  /**
   * @dev Adds a new merchant to the event only if the merchant has allowed being added.
   * @param _eventID uint Event ID
   * @param _merchantAddress address Merchant's address
   */
  function registerMerchant(uint _eventID, address _merchantAddress) onlyOwner isInRange(_eventID) public returns(bool) {
    Event storage mEvent = events[_eventID];
    require(mEvent.allowedToRegister[_merchantAddress]);
    
    mEvent.merchants[_merchantAddress] = true;
    emit MerchantAction(_merchantAddress, true);
    return true;
  }

  /**
   * @dev Removes a merchant from the event.
   * @param _eventID uint Event ID
   * @param _merchantAddress address merchant's address
   */
  function removeMerchant(uint _eventID,  address _merchantAddress) onlyOwner isInRange(_eventID) public returns(bool) {
    Event storage mEvent = events[_eventID];
    mEvent.merchants[_merchantAddress] = false;
    emit MerchantAction(_merchantAddress, false);
    return true;
  }

  /**
   * Updates an Event
   * @param _name uint Event name
   * @param _openingTime uint Event Opening time
   * @param _closingTime uint Event Closing time, can be 0 if event is continuous
   */
  function updateEvent(uint _eventID, string _name, uint _openingTime, uint _closingTime) onlyOwner isInRange(_eventID) public returns (bool) {
    Event storage mEvent = events[_eventID];
    mEvent.name = _name;
    mEvent.openingTime = _openingTime;
    mEvent.closingTime = _closingTime;
    return true;
  }

  /**
   * @dev Allows the current owner to transfer control of the contract to a newOwner.
   * @param _newOwner The address to transfer ownership to.
   */
  function transferOwnershipDeep(address _newOwner) onlyOwnerOrOrigin public {
    require(_newOwner != address(0));
    emit OwnershipTransferred(owner, _newOwner);
    owner = _newOwner;
  }

  /**
   * @dev Function to check if a merchant allows an event to register him
   * @param _eventID uint Event ID
   * @param _merchant address The address of the merchant.
   * @return A boolean specifying if the merchant has approved
   */
  function allowanceRegistration(uint _eventID, address _merchant) isInRange(_eventID) public view returns (bool) {
    Event storage mEvent = events[_eventID];
    return mEvent.allowedToRegister[_merchant];
  }

  /**
   * @dev Checks if a merchant is registered to the event.
   * @param _eventID uint Event ID
   * @param _merchantAddress address merchant's address
   */
  function isMerchantRegistered(uint _eventID, address _merchantAddress) isInRange(_eventID) public view returns(bool) {
    return events[_eventID].merchants[_merchantAddress];
  }

  /**
   * @dev Returns the number of events created
   */
  function numEvents() public view returns (uint) {
    return events.length;
  }
}
