import { FeeData, parseUnits, Wallet } from 'ethers';
import { ethers } from "hardhat";
import axios from 'axios';
import { Example__factory } from '../typechain-types';

type GetFeedDataFunction = () => Promise<FeeData>;

interface PolygonGasStationAnswer {
    fast: {
        maxPriorityFee: number;
        maxFee: number;
    };
}

function assert(
    condition: boolean,
    message: string,
): asserts condition {
    if (!condition) throw new Error(message);
}

const getFeeData: (overpay: number) => GetFeedDataFunction = (overpay = 0) => async () => {
    const data = (await axios
        .get(process.env.GAS_STATION_URL!)
        .then((v) => v.data)) as PolygonGasStationAnswer;

    return {
        maxPriorityFeePerGas: parseUnits(
            (Math.ceil(data.fast.maxPriorityFee) + overpay).toString(),
            "gwei"
        ),
        maxFeePerGas: parseUnits(
            (Math.ceil(data.fast.maxFee) + overpay).toString(),
            "gwei"
        ),
        lastBaseFeePerGas: null,
        gasPrice: null,
        toJSON: () => ({})
    };
};

async function main() {
    const maintainer: Wallet = new ethers.Wallet(
        process.env.MAINTAINER_PRIVATE_KEY as string
    ).connect(ethers.provider);

    // Patch provider to correctly compute gas prices for Polygon
    ethers.provider.getFeeData = getFeeData(1);

    const maintainerAddress = await maintainer.getAddress();

    const network = await ethers.provider.getNetwork();

    console.log("Current network:", network.toJSON());
    console.log("Current deployer:", maintainerAddress);

    console.log("----".repeat(20));

    const exampleFactory = new Example__factory(maintainer);

    // Deploying contract
    const example = await exampleFactory.deploy(1);

    await example.waitForDeployment();

    // Configure after deploy
    await example.setB(2).then(tx => tx.wait());
    await example.setC(3).then(tx => tx.wait());
    await example.setD(4).then(tx => tx.wait());

    console.log('Example: ', await example.getAddress());
    console.log('A: ', await example.a());
    console.log('B: ', await example.b());
    console.log('C: ', await example.c());
    console.log('D: ', await example.d());

    // Optionally check for value correctness before proceeding
    assert(await example.b() === 2n, 'B is not correct');

    // Check for target functions
    console.log('Product: ', await example.product());

    const deployData = {
        Example: await example.getAddress(),
        Network: network.toJSON(),
        Deployer: maintainerAddress
    }

    console.log('Deploy artifact: ', JSON.stringify(deployData, undefined, 4));
}

main();
