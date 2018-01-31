pragma solidity ^0.4.19;

import 'interfaces/IEIP165Cache.sol';
import 'utils/Ownable.sol';

// Based on EIP165Cache from @jbaylina
// https://github.com/jbaylina/EIP165Cache/blob/master/contracts/EIP165Cache.sol
//
// Changes:
// * Optimizations
// * Allow cache refresh
// * Allow owner override

contract EIP165Cache is Ownable, IEIP165Cache {

    
    mapping (address => mapping (bytes4 => Status)) cache;
    
    mapping (address => mapping (bytes4 => Status)) overrides;
    
    function query(address addr, bytes4 iface)
        public
        returns (Status)
    {
        Status status = cache[addr][iface];
        if (status != Status.Unknown) {
            return status;
        }
        
        // Apply optional override
        status = overrides[addr][iface];
        if (status != Status.Unknown) {
            cache[addr][iface] = status;
            return status;
        }
        
        // Check for IEIP165 support
        Status eip165Status;
        eip165Status = cache[addr][IEIP165.INTERFACE_ID];
        if (eip165Status == Status.Unsupported) {
            // TODO: Do we want to cache this? (three lookups vs one?)
            // Note: The edge case where iface == IEIP165.INTERFACE_ID is
            // covered by the first conditional.
            return Status.Unknown;
        }
        
        // Test for IEIP165 support
        if (eip165Status == Status.Unknown) {
            bool success1;
            bool success2;
            bool result1;
            bool result2;
            (success1, result1) = noThrowCall(addr, IEIP165.INTERFACE_ID);
            (success2, result2) = noThrowCall(addr, IEIP165.INVALID_ID);
            bool eip165Supported = success1 && success2 && result1 && !result2;
            eip165Status = eip165Supported ? Status.Supported : Status.Unsupported;
            cache[addr][IEIP165.INTERFACE_ID] = eip165Status;
        }
        
        // Test for interface support
        if (eip165Status == Status.Supported) {
            IEIP165 ieip165 = IEIP165(addr);
            bool supported = ieip165.supportsInterface(iface);
            status = supported ? Status.Supported : Status.Unsupported;
            cache[addr][iface] = status;
            return status;
        } else {
            // assert(eip165Status == Unsupported);
            return Status.Unknown;
        }
    }
    
    function query(address addr, bytes4[] interfaces)
        public
        returns (uint256 bitvector)
    {
        require(interfaces.length <= 256);
        bitvector = 0;
        for (int256 i = int256(interfaces.length) - 1; i >= 0; --i) {
            
            // Bit shift bitvector left one.
            bitvector += bitvector;
            
            // TODO Could cache contract IEIP165 support
            Status status = query(addr, interfaces[uint256(i)]);
            if (status == Status.Supported) {
                bitvector |= 1;
            }
        }
        return bitvector;
    }
    
    function refresh(address addr, bytes4 iface)
        public
    {
        // Clear cache
        cache[addr][iface] = Status.Unknown;
        
        // Force reload cache
        query(addr, iface);
    }
    
    function override(address addr, bytes4 iface, Status status)
        public
        onlyOwner()
    {
        overrides[addr][iface] = status;
    }

    function noThrowCall(address addr, bytes4 iface)
        internal
        returns (bool success, bool result)
    {
        // Function signature
        bytes4 sig = bytes4(keccak256("supportsInterface(bytes4)"));
        
        assembly {
            let x := mload(0x40)   //Find empty storage location using "free memory pointer"
            mstore(x, sig) //Place signature at begining of empty storage
            mstore(add(x, 0x04), iface) //Place first argument directly next to signature

            success := call(      //This is the critical change (Pop the top stack value)
                30000,
                addr, //To addr
                0,    //No value
                x,    //Inputs are stored at location x
                0x8, //Inputs are 8 byes long
                x,    //Store output over input (saves space)
                0x20) //Outputs are 32 bytes long

            result := mload(x)   // Load the result
        }
    }
}
