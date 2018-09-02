pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/lifecycle/Destructible.sol";
import "./Organization.sol";

contract Consortium is Destructible {

    /* --- Structures and variables --- */
    struct Member {
        string name;
        address member;
        Organization organization;
        uint since;
    }

    mapping (address => uint) public memberId;
    Member[] public members;

    /* --- Events --- */
    event MembershipChanged(address member, bool isMember);

    /* --- Modifiers --- */
    modifier onlyMembers {
        require(memberId[msg.sender] != 0);
        _;
    }

    /* --- Public functions --- */

    /**
     * Constructor function
     */
    constructor() public {
        addMember(owner, "Consortium Funder");
    }

    /**
     * Add member
     *
     * Make `targetMember` a member named `memberName`
     *
     * @param _targetMember ethereum address to be added
     * @param _memberName public name for that member
     */
    function addMember(address _targetMember, string _memberName) onlyOwner public returns(bool) {
        uint id = memberId[_targetMember];
        if (id == 0) {
            memberId[_targetMember] = members.length;
            id = members.length++;
        }

        Organization org = new Organization(_memberName);
        org.transferOwnership(_targetMember);
        members[id] = Member({name: _memberName, member: _targetMember, organization: org, since: now});
        emit MembershipChanged(_targetMember, true);
        return true;
    }

    /**
     * Update member name
     * @param _name public name for that member
     */
    function updateMemberName(string _name) onlyMembers public returns (bool) {
        members[memberId[msg.sender]].name = _name;
        return true;
    }

    /**
     * Update member
     * @param _name public name for that member
     * @param _memberAddress ethereum address to be added
     */
    function updateMember(string _name, address _memberAddress) onlyMembers public returns (bool) {
        Member storage member = members[memberId[msg.sender]];
        member.name = _name;
        member.organization.transferOwnershipDeep(_memberAddress);
        member.member = _memberAddress;
        emit MembershipChanged(_memberAddress, true);
        return true;
    }

    /**
     * Remove member 
     *
     * @notice Remove membership from `msg.sender` called by member itself
     */
    function removeMember() onlyMembers public {
        for (uint i = memberId[msg.sender]; i < members.length-1; i++){
            members[i] = members[i+1];
        }
        memberId[msg.sender] = 0;
        delete members[members.length-1];
        members.length--;
    }

    /**
     * Remove member
     *
     * @notice Remove membership from `targetMember` called by owner
     * @param _targetMember ethereum address to be removed
     */
    function removeMember(address _targetMember) onlyOwner public {
        require(memberId[_targetMember] != 0);

        for (uint i = memberId[_targetMember]; i < members.length-1; i++){
            members[i] = members[i+1];
        }
        memberId[_targetMember] = 0;
        delete members[members.length-1];
        members.length--;
    }

    /**
     * Check if passed address is a Member
     *
     * @param _targetMember address to check
     */
    function isMember(address _targetMember) public view returns (bool) {
        return memberId[_targetMember] != 0;
    } 

    /**
     * Returns the number of members in the consortium
     */
    function numMembers() public view returns (uint) {
        return members.length;
    }
}