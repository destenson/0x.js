pragma solidity ^0.4.19;

import 'interfaces/IEIP165.sol';

contract IEIP165Cache is IEIP165 {
    
    bytes4 INTERFACE_ID = 
        bytes4(keccak256('query(address,bytes4)')) ^
        bytes4(keccak256('query(address,bytes4[])'));

    function IEIP165Cache()
        public
    {
        supportsInterface[INTERFACE_ID] = true;
    }
    
    enum Status {
        Unknown,
        Unsupported,
        Supported
    }
    
    function query(address addr, bytes4 iface)
        public
        returns (Status);
    
    function query(address addr, bytes4[] ifaces)
        public
        returns (uint256 r);
}
