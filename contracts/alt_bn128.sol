pragma solidity ^0.4.24;

library alt_bn128 {

    // uint256 public constant q = 21888242871839275222246405745257275088548364400416034343698204186575808495617; // curve order
    // uint256 public constant n = 21888242871839275222246405745257275088696311157297823662689037894645226208583; // prime field order
    // uint256 public constant b = 3;

    // uint256 constant public ECSignMask = 0x8000000000000000000000000000000000000000000000000000000000000000;
    // uint256 constant public BigModExponent = (n + 1)/4;

    struct G1Point {
        uint256 X;
        uint256 Y;
    }

    function add(G1Point p1, G1Point p2) internal view returns (G1Point r) {
        uint256[4] memory input;
        input[0] = p1.X;
        input[1] = p1.Y;
        input[2] = p2.X;
        input[3] = p2.Y;
        assembly {
            if iszero(staticcall(not(0), 6, input, 0x80, r, 0x40)) {
                revert(0, 0)
            }
        }
    }

    function mul(G1Point p, uint256 s) internal view returns (G1Point r) {
        if (s == 1) {
            return p;
        }
        if (s == 2) {
            return add(p, p);
        }
        uint256[3] memory input;
        input[0] = p.X;
        input[1] = p.Y;
        input[2] = s;
        assembly {
            if iszero(staticcall(not(0), 7, input, 0x60, r, 0x40)) {
                revert(0, 0)
            }
        }
    }

    function neg(G1Point p) internal pure returns (G1Point) {
        if (p.X == 0 && p.Y == 0)
            return G1Point(0, 0);
        uint256 n = 21888242871839275222246405745257275088696311157297823662689037894645226208583;
        return G1Point(p.X, n - p.Y);
    }

    function compress(G1Point p) internal pure returns (uint256 out) {
        uint256 ECSignMask = 0x8000000000000000000000000000000000000000000000000000000000000000;
        
        // Store x value
    	out = p.X;
   	 
    	// Determine Sign
    	if ((p.Y & 0x1) == 0x1) {
        	out |= ECSignMask;
    	}
    }

    function evaluateCurve(uint256 x) public view returns (uint256 y, bool onCurve) {
        uint256 PCurve = 0x30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd47;
        uint256 a = 0xc19139cb84c680a6e14116da060561765e05aa45a1c72a34f082305b61f3f52; // (p + 1) / 4

    	uint256 y_squared = mulmod(x, x, PCurve);
    	y_squared = mulmod(y_squared, x, PCurve);
    	y_squared = addmod(y_squared, 3, PCurve);
   	 
    	uint256 p_local = PCurve;
    	uint256 a_local = a;
   	 
    	assembly {
        	//Get Free Memory Pointer
        	let p := mload(0x40)
       	 
        	//Store Data for Big Int Mod Exp Call
        	mstore(p, 0x20)             	//Length of Base
        	mstore(add(p, 0x20), 0x20)  	//Length of Exponent
        	mstore(add(p, 0x40), 0x20)  	//Length of Modulus
        	mstore(add(p, 0x60), y_squared) //Base
        	mstore(add(p, 0x80), a_local)   //Exponent
        	mstore(add(p, 0xA0), p_local)   //Modulus
       	 
        	//Call Big Int Mod Exp
        	let success := call(sub(gas, 2000), 0x05, 0, p, 0xC0, p, 0x20)
       	 
        	// Use "invalid" to make gas estimation work
         	switch success case 0 { revert(p, 0xC0) }
        	 
         	//Store Return Data
         	y := mload(p)
    	}
   	 
    	//Check Answer
    	onCurve = (y_squared == mulmod(y, y, PCurve));
	}

    function decompress(uint256 p) internal view returns (G1Point pOut) {
        uint256 ECSignMask = 0x8000000000000000000000000000000000000000000000000000000000000000;
        uint256 PCurve = 0x30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd47;
        uint256[2] memory tmp;

        // Get x value (mask out sign bit)
    	tmp[0] = p & (~ECSignMask);
   	 
    	// Get y value
    	bool onCurve;
    	uint256 y;
    	(y, onCurve) = evaluateCurve(tmp[0]);
   	 
    	// TODO: Find better failure case for point not on curve
    	if (!onCurve) {
    	    return G1Point(uint256(0), 0);
    	}
    	else {
        	// Use Positive Y
        	if ((p & ECSignMask) != 0) {
            	if ((y & 0x1) == 0x1) {
                	tmp[1] = y;
            	} else {
                	tmp[1] = PCurve - y;
            	}
        	}
        	// Use Negative Y
        	else {
            	if ((y & 0x1) == 0x1) {
                	tmp[1] = PCurve - y;
            	} else {
                	tmp[1] = y;
            	}
        	}
    	}

        return G1Point(tmp[0], tmp[1]);
    }

    function eq(G1Point p1, G1Point p2) internal pure returns (bool) {
        return p1.X == p2.X && p1.Y == p2.Y;
    }

    function add(uint256 x, uint256 y) internal pure returns (uint256) {
        uint256 q = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
        return addmod(x, y, q);
    }

    function mul(uint256 x, uint256 y) internal pure returns (uint256) {
        uint256 q = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
        return mulmod(x, y, q);
    }

    function inv(uint256 x) internal pure returns (uint) {
        uint256 p = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
        uint256 a = x;
        if (a == 0)
            return 0;
        if (a > p)
            a = a % p;
        int t1;
        int t2 = 1;
        uint r1 = p;
        uint r2 = a;
        uint q;
        while (r2 != 0) {
            q = r1 / r2;
            (t1, t2, r1, r2) = (t2, t1 - int(q) * t2, r2, r1 - q * r2);
        }
        if (t1 < 0)
            return (p - uint(-t1));
        return uint(t1);
    }

    function mod(uint256 x) internal pure returns (uint256) {
        uint256 q = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
        return x % q;
    }

    function sub(uint256 x, uint256 y) internal pure returns (uint256) {
        uint256 q = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
        return x >= y ? x - y : q - y + x;
    }

    function neg(uint256 x) internal pure returns (uint256) {
        return 21888242871839275222246405745257275088548364400416034343698204186575808495617 - x;
    }

    function modExp(uint256 base, uint256 exponent, uint256 modulus) internal view returns (uint256) {
        uint256[6] memory input;
        uint256[1] memory output;
        input[0] = 0x20;  // length_of_BASE
        input[1] = 0x20;  // length_of_EXPONENT
        input[2] = 0x20;  // length_of_MODULUS
        input[3] = base;
        input[4] = exponent;
        input[5] = modulus;
        assembly {
            if iszero(staticcall(not(0), 5, input, 0xc0, output, 0x20)) {
                revert(0, 0)
            }
        }
        return output[0];
    }

    function modExp(uint256 base, uint256 exponent) internal view returns (uint256) {
        uint256 q = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
        return modExp(base, exponent, q);
    }

    function hashToCurve(bytes input) internal view returns (G1Point p) {
        uint256 seed = uint256(keccak256(input));
        return uintToCurvePoint(seed);
    }

    function uintToCurvePoint(uint256 x) internal view returns(G1Point p) {
        uint256 n = 21888242871839275222246405745257275088696311157297823662689037894645226208583;
        uint256 seed = x % n;
        uint256 y;
        seed -= 1;
        bool onCurve = false;
        uint256 y2;
        uint256 b = uint256(3);
        while(!onCurve) {
            seed += 1;
            y2 = mulmod(seed, seed, n);
            y2 = mulmod(y2, seed, n);
            y2 = addmod(y2, b, n);
            y = modExp(y2, (n + 1) / 4, n);
            onCurve = mulmod(y, y, n) == y2;
        }
        return G1Point(seed, y);
    }
}
