/// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

contract Example {
   uint public a;
   uint public b;
   uint public c;
   uint public d;

    constructor(uint _a) {
        a = _a;
    }

    function setB(uint _b) external {
        b = _b;
    }

    function setC(uint _c) external {
        c = _c;
    }

    function setD(uint _d) external {
        d = _d;
    }

    function product() external view returns(uint) {
        return a*b*c*d;
    }
}
