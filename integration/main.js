const Web3 = require('web3');

const TermsTemplate = require('./TermsTemplate.json');

const EconomicsRegistryArtifact = require('../ap-monorepo/packages/ap-contracts/build/contracts/EconomicsRegistry.json');
const PAMEngineArtifact = require('../ap-monorepo/packages/ap-contracts/build/contracts/PAMEngine.json');
const AssetActorArtifact = require('../ap-monorepo/packages/ap-contracts/build/contracts/AssetActor.json');
const PaymentRouterArtifact = require('../ap-monorepo/packages/ap-contracts/build/contracts/PaymentRouter.json');
const PaymentRegistryArtifact = require('../ap-monorepo/packages/ap-contracts/build/contracts/PaymentRegistry.json');
const DividendCheckpointAdapterArtifact = require('./build/contracts/DividendCheckpointAdapter.json');

const PolymathRegistryArtifact = require('../polymath-core/build/contracts/PolymathRegistry.json');
const PolyTokenFaucetArtifact = require('../polymath-core/build/contracts/PolyTokenFaucet.json');
const STRArtifact = require('../polymath-core/build/contracts/SecurityTokenRegistry.json');
const SecurityTokenArtifact = require('../polymath-core/build/contracts/SecurityToken.json');
const GeneralTransferManagerArtifact = require('../polymath-core/build/contracts/GeneralTransferManager.json');
const GeneralPermissionManagerArtifact = require('../polymath-core/build/contracts/GeneralPermissionManager.json');
const GeneralPermissionManagerFactoryArtifact = require('../polymath-core/build/contracts/GeneralPermissionManagerFactory.json');
const EtherDividendCheckpointArtifact = require('../polymath-core/build/contracts/EtherDividendCheckpoint.json');
const EtherDividendCheckpointFactoryArtifact = require('../polymath-core/build/contracts/EtherDividendCheckpointFactory.json');
const ActusSTOArtifact = require('../polymath-core/build/contracts/ActusSTO.json');
const ActusSTOObligorArtifact = require('../polymath-core/build/contracts/ActusSTOObligor.json');
const ActusSTOFactoryArtifact = require('../polymath-core/build/contracts/ActusSTOFactory.json');


const web3 = new Web3('http://localhost:8545', null, { transactionConfirmationBlocks: 1, defaultGas: 8000000 });

let PolymathRegistryInstance;
let PolyTokenInstance;
let STRInstance;
let SecurityTokenInstance;
let GeneralTransferManagerInstance;
let GeneralPermissionManagerInstance;
let GeneralPermissionManagerFactoryInstance;
let ActusSTOInstance;
let ActusSTOObligorInstance
let ActusSTOFactoryInstance;
let EtherDividendCheckpointInstance
let EtherDividendCheckpointFactoryInstance;

let DividendCheckpointAdapterInstance;

let EconomicsRegistryInstance;
let PAMEngineInstance;
let PaymentRouterInstance;
let PaymentRegistryInstance;
let AssetActorInstance;

// Polymath Accounts
let account_tokenOwner;
let account_issuer;
let account_investor;
// ACTUS Accounts
let account_recordCreatorObligor;
let account_recordCreatorBeneficiary;
let account_counterpartyObligor;
let account_counterpartyBeneficiary;

// ACTUS asset parameters
const assetId = 'ACTUS_DEBT_ASSET' + Math.floor(Math.random() * 1000);
const notionalPrincipal = web3.utils.toWei('100');
// SecurityToken Details for funds raise Type ETH
const stName = 'ACTUS_DEBT_ASSET_TOKEN';
const stTickerSymbol = 'AAT' + Math.floor(Math.random() * 1000);
const stDetails = 'Claims on future cashflow';
const stoCap = notionalPrincipal;
const stoRate = web3.utils.toWei('1');
const stoFundRaiseCurrency = 0; // 0 for ETH
// Module Keys / Types
const ModuleTypes = {
  'GeneralPermissionManager': 1,
  'GeneralTransferManager': 2,
  'ActusSTO': 3,
  'DividendCheckpoint': 4
}
// ACTUS STO
const actusSTOParameters = ['uint256', 'uint256', 'uint256', 'uint256', 'uint8[]'];
// Dividend Module
const dividendParameters = ['address'];
// General Permission Manager Module
const permissionParameters = [];

async function mineBlock (blockTimestamp) {
  await web3.currentProvider.send('evm_mine', [blockTimestamp]);
}

async function getLatestBlockTimestamp () {
  return (await web3.eth.getBlock('latest')).timestamp.toString();
}

function encodeModuleCall (parameterTypes, parameterValues) {
  if (parameterTypes.length === 0) { return '0x'; }

  const functionSignature = web3.eth.abi.encodeFunctionSignature('configure(' + parameterTypes.toString() + ')');
  const encodedParameters = web3.eth.abi.encodeParameters(parameterTypes, parameterValues);

  return functionSignature + encodedParameters.substr(2);
}

async function initializeAccounts () {
  const accounts = await web3.eth.getAccounts();

  account_tokenOwner = accounts[2];
  account_issuer = account_tokenOwner;
  account_recordCreatorObligor = account_issuer;
  account_recordCreatorBeneficiary = account_issuer;
  account_investor = accounts[3];
  account_keeper = accounts[4];

  await PolyTokenInstance.methods.getTokens(web3.utils.toWei('10000'), account_tokenOwner).send({ from: account_tokenOwner });
  
  const balance_tokenOwner = (await PolyTokenInstance.methods.balanceOf(account_tokenOwner).call()).toString()
  console.log('Token Owner Balance: ' + balance_tokenOwner);
  console.log('');
}

async function instantiateContracts () {
  const networkId = await web3.eth.net.getId();

  PAMEngineInstance = new web3.eth.Contract(PAMEngineArtifact.abi, PAMEngineArtifact.networks[networkId].address);
  EconomicsRegistryInstance = new web3.eth.Contract(EconomicsRegistryArtifact.abi, EconomicsRegistryArtifact.networks[networkId].address);
  PaymentRouterInstance = new web3.eth.Contract(PaymentRouterArtifact.abi, PaymentRouterArtifact.networks[networkId].address);
  PaymentRegistryInstance = new web3.eth.Contract(PaymentRegistryArtifact.abi, PaymentRegistryArtifact.networks[networkId].address);
  AssetActorInstance = new web3.eth.Contract(AssetActorArtifact.abi, AssetActorArtifact.networks[networkId].address);

  PolymathRegistryInstance = new web3.eth.Contract(PolymathRegistryArtifact.abi, PolymathRegistryArtifact.networks[networkId].address);
  const PolyTokenAddress = await PolymathRegistryInstance.methods.getAddress('PolyToken').call();
  const STRAddress = await PolymathRegistryInstance.methods.getAddress('SecurityTokenRegistry').call();
  PolyTokenInstance = new web3.eth.Contract(PolyTokenFaucetArtifact.abi, PolyTokenAddress);
  STRInstance = new web3.eth.Contract(STRArtifact.abi, STRAddress);

  ActusSTOFactoryInstance = new web3.eth.Contract(ActusSTOFactoryArtifact.abi, ActusSTOFactoryArtifact.networks[networkId].address);
  EtherDividendCheckpointFactoryInstance = new web3.eth.Contract(EtherDividendCheckpointFactoryArtifact.abi, EtherDividendCheckpointFactoryArtifact.networks[networkId].address);
  GeneralPermissionManagerFactoryInstance = new web3.eth.Contract(GeneralPermissionManagerFactoryArtifact.abi, GeneralPermissionManagerFactoryArtifact.networks[networkId].address);
}

// deploy STO
async function deployActusSTO () {
  console.log('1. Deploy ACTUS STO');
  console.log('');
  // register ticker symbol
  console.log('1.1. Registry Ticker Symbol for ST');
  const stTickerRegistrationFee = (await STRInstance.methods.getTickerRegistrationFee().call()).toString();
  await PolyTokenInstance.methods.approve(STRInstance.address, stTickerRegistrationFee).send({ from: account_tokenOwner });
  const tx1 = await STRInstance.methods.registerTicker(account_tokenOwner, stTickerSymbol, stName).send({ from: account_tokenOwner });
  console.log(' Ticker Owner: ' + tx1.events.RegisterTicker.returnValues._owner);
  console.log(' Ticker Symbol: ' + tx1.events.RegisterTicker.returnValues._ticker);
  console.log(' Ticker Name: ' + tx1.events.RegisterTicker.returnValues._name);
  console.log(' Ticker Expiry: ' + tx1.events.RegisterTicker.returnValues._expiryDate.toString());
  console.log('');

  // deploy STO
  console.log('1.2. Deploy ST and STO:');
  const stLaunchFee = (await STRInstance.methods.getSecurityTokenLaunchFee().call()).toString();
  await PolyTokenInstance.methods.approve(STRInstance.address, stLaunchFee).send({ from: account_issuer });
  const tx2 = await STRInstance.methods.generateSecurityToken(stName, stTickerSymbol, stDetails, false).send({ from: account_issuer });
  console.log(' Security Token Address: ' + tx2.events.NewSecurityToken.returnValues._securityTokenAddress);
  console.log(' Security Token Owner: ' + tx2.events.NewSecurityToken.returnValues._owner);
  console.log(' Security Token Added Date: ' + tx2.events.NewSecurityToken.returnValues._addedAt);
  console.log('');
  SecurityTokenInstance = new web3.eth.Contract(
    SecurityTokenArtifact.abi, 
    tx2.events.NewSecurityToken.returnValues._securityTokenAddress
  );

  // get GeneralTransferManager & GeneralPermissionManager  addresses
  GeneralTransferManagerInstance = new web3.eth.Contract(
    GeneralTransferManagerArtifact.abi,
    (await SecurityTokenInstance.methods.getModulesByType(ModuleTypes.GeneralTransferManager).call())[0]
  );

  // add General Permission Manager Module
  console.log('1.3. Attach General Permission Module');
  const bytesPermission = encodeModuleCall(permissionParameters, []);
  const tx3 = await SecurityTokenInstance.methods.addModule(GeneralPermissionManagerFactoryInstance.address, bytesPermission, 0, 0).send({ from: account_issuer });
  console.log(' General Permission Module Address: ' + tx3.events.ModuleAdded.returnValues._module);
  console.log(' General Permission Module Name: ' + web3.utils.hexToString(tx3.events.ModuleAdded.returnValues._name));
  console.log(' General Permission Module Key: ' + tx3.events.ModuleAdded.returnValues._types[0]);
  console.log('');
  const regGeneralPermissionManagerAddress = (await SecurityTokenInstance.methods.getModulesByType(ModuleTypes.GeneralPermissionManager).call())[0];
  if (regGeneralPermissionManagerAddress !== tx3.events.ModuleAdded.returnValues._module) {
    throw(new Error('General Permission Manager Module Address does not match!'));
  }
  GeneralPermissionManagerInstance = new web3.eth.Contract(
    GeneralPermissionManagerArtifact.abi,
    regGeneralPermissionManagerAddress
  );
  
  // add ACTUS module
  console.log('1.4. Attach ACTUS STO Module');
  const actusSTOSetupCost = (await ActusSTOFactoryInstance.methods.getSetupCost().call()).toString();
  await PolyTokenInstance.methods.transfer(SecurityTokenInstance.address, actusSTOSetupCost).send({ from: account_issuer });
  const stoStartTime = Number(await getLatestBlockTimestamp()) + 86400; // + 1 day
  const stoEndTime = Number(stoStartTime) + 2592000; // + 30 days
  const bytesSTO = encodeModuleCall(actusSTOParameters, [stoStartTime, stoEndTime, stoCap, stoRate, [stoFundRaiseCurrency]]);
  const tx4 = await SecurityTokenInstance.methods.addModule(ActusSTOFactoryInstance.address, bytesSTO, actusSTOSetupCost, 0).send({ from: account_issuer });
  console.log(' ACTUS STO Module Address: ' + tx4.events.ModuleAdded.returnValues._module);
  console.log(' ACTUS STO Module Name: ' + web3.utils.hexToString(tx4.events.ModuleAdded.returnValues._name));
  console.log(' ACTUS STO Module Key: ' + tx4.events.ModuleAdded.returnValues._types[0]);
  console.log(' ACTUS STO Start Time: ' + stoStartTime);
  console.log(' ACTUS STO End Time: ' + stoEndTime);
  console.log(' ACTUS STO Cap: ' + web3.utils.fromWei(stoCap) + ' Ether');
  const regActusSTOAddress = (await SecurityTokenInstance.methods.getModulesByType(ModuleTypes.ActusSTO).call())[0];
  if (regActusSTOAddress !== tx4.events.ModuleAdded.returnValues._module) {
    throw(new Error('ACTUS STO Module Address does not match!'));
  }
  ActusSTOInstance = new web3.eth.Contract(
    ActusSTOArtifact.abi, 
    regActusSTOAddress
  );
  ActusSTOObligorInstance = new web3.eth.Contract(
    ActusSTOObligorArtifact.abi,
    await ActusSTOInstance.methods.obligor().call()
  );
  console.log(' ACTUS STO Module Obligor Address: ' + ActusSTOObligorInstance.address);
  console.log('');
  
  // add Dividend module
  console.log('1.5. Attach Dividend Module');
  const bytesDividend = encodeModuleCall(dividendParameters, [account_issuer]);
  const tx5 = await SecurityTokenInstance.methods.addModule(EtherDividendCheckpointFactoryInstance.address, bytesDividend, 0, 0).send({ from: account_issuer });
  console.log(' Dividend Module Address: ' + tx5.events.ModuleAdded.returnValues._module);
  console.log(' Dividend Module Name: ' + web3.utils.hexToString(tx5.events.ModuleAdded.returnValues._name));
  console.log(' Dividend Module Key: ' + tx5.events.ModuleAdded.returnValues._types[0]);
  console.log('');
  const regDividendCheckpointAddress = (await SecurityTokenInstance.methods.getModulesByType(ModuleTypes.DividendCheckpoint).call())[0];
  if (regDividendCheckpointAddress !== tx5.events.ModuleAdded.returnValues._module) {
    throw(new Error('Dividend Module Address does not match!'));
  }
  EtherDividendCheckpointInstance = new web3.eth.Contract(
    EtherDividendCheckpointArtifact.abi,
    regDividendCheckpointAddress
  );

  // deploy DividendCheckpointAdapter
  console.log('1.6. Deploy DividendCheckpointAdapter');
  DividendCheckpointAdapterInstance = new web3.eth.Contract(DividendCheckpointAdapterArtifact.abi);
  DividendCheckpointAdapterInstance = await DividendCheckpointAdapterInstance.deploy({
    data: DividendCheckpointAdapterArtifact.bytecode,
    arguments: [PaymentRouterInstance.address, EtherDividendCheckpointInstance.address]
  }).send({ from: account_issuer });
  console.log(' Dividend Checkpoint Adapter Address: ' + DividendCheckpointAdapterInstance.address);
  console.log('');

  // allow DividendCheckpointAdapter to create a dividend
  console.log('1.7. Add DividendCheckpointAdapter as delegate and update permissions');
  await GeneralPermissionManagerInstance.methods.addDelegate(
    DividendCheckpointAdapterInstance.address,
    web3.utils.asciiToHex('DividendCheckpointAdapter')
  ).send({ from: account_issuer });
  await GeneralPermissionManagerInstance.methods.changePermission(
    DividendCheckpointAdapterInstance.address,
    EtherDividendCheckpointInstance.address,
    web3.utils.asciiToHex('MANAGE'),
    true
  ).send({ from: account_issuer });

  console.log(' Has permission \'MANAGE\': ' + await GeneralPermissionManagerInstance.methods.checkPermission(
    DividendCheckpointAdapterInstance.address, 
    EtherDividendCheckpointInstance.address,
    web3.utils.asciiToHex('MANAGE')
  ).call());
  console.log('');

  // set STO as counterparty
  account_counterpartyObligor = ActusSTOObligorInstance.address;
  account_counterpartyBeneficiary = DividendCheckpointAdapterInstance.address;
}

// deploy asset
async function deployAsset () {
  console.log('2. Issue ACTUS Asset');

  // get end timestamp of STO
  const stoEndTime = (await ActusSTOInstance.methods.endTime().call()).toString();
  
  const terms = TermsTemplate;
  terms.notionalPrincipal = web3.utils.toHex(notionalPrincipal);
  terms.statusDate = Number(await getLatestBlockTimestamp());
  terms.contractDealDate = Number(terms.statusDate);
  terms.initialExchangeDate = Number(stoEndTime) + 86400; // day after STO ended
  terms.cycleAnchorDateOfInterestPayment = Number(terms.initialExchangeDate);
  terms.maturityDate = Math.trunc(new Date().setFullYear(new Date(Number(terms.initialExchangeDate) * 1000).getFullYear() + 1) / 1000); // plus one year
  
  const ownership = {
    recordCreatorObligor: account_recordCreatorObligor,
    recordCreatorBeneficiary: account_recordCreatorBeneficiary,
    counterpartyObligor: account_counterpartyObligor,
    counterpartyBeneficiary: account_counterpartyBeneficiary
  };

  await AssetActorInstance.methods.initialize(
    web3.utils.asciiToHex(assetId),
    ownership,
    terms
  ).send({ from: account_recordCreatorObligor });
  
  console.log(' Asset Id: ' + assetId);
  console.log(' Initial Exchange Date: ' + terms.initialExchangeDate);
  console.log(' Maturity Date: ' + terms.maturityDate);
  console.log('');
}

// link ACTUS asset to STO
async function linkAssetToSTO () {
  console.log('3. Link ACTUS asset to STO');
  
  await ActusSTOInstance.methods.linkAsset(web3.utils.asciiToHex(assetId), PaymentRouterInstance.address).send({ from: account_issuer });
  
  console.log('');
}

// collect investors funds
async function buyTokensFromSTO () {
  console.log('4. Buy Tokens from STO');
  console.log('');
  console.log('4.1. Add investors to whitelist');
  const sendAfter = (await ActusSTOInstance.methods.endTime().call()).toString();
  const receiveAfter = sendAfter;
  const expiryTime = sendAfter;
  await GeneralTransferManagerInstance.methods.modifyWhitelist(account_investor, sendAfter, receiveAfter, expiryTime, true).send({
    from: account_issuer
  });
  console.log(' Whitelisted Investor: ' + account_investor);
  console.log('');

  console.log('4.2. Buy ACTUS STO Tokens');
  await mineBlock((await ActusSTOInstance.methods.startTime().call()).toString());

  await web3.eth.sendTransaction({
    from: account_investor,
    to: ActusSTOInstance.address,
    gas: 2100000,
    value: web3.utils.toWei('100', 'ether')
  });

  const tokenBought = web3.utils.fromWei((await SecurityTokenInstance.methods.balanceOf(account_investor).call()).toString());
  const tokenSold = web3.utils.fromWei((await ActusSTOInstance.methods.getTokensSold.call()).toString());
  const actusSTOObligorBalance = (await web3.eth.getBalance(ActusSTOObligorInstance.address)).toString();
  console.log(' Buyer Address: ' + account_investor);
  console.log(' Tokens bought: ' + tokenBought);
  console.log(' Total number of ST sold: ' + tokenSold);
  console.log(' ACTUS STO Obligor Balance: ' + web3.utils.fromWei(actusSTOObligorBalance) + ' Ether');
  console.log('');
}

// pay principal
async function payPrincipal () {
  console.log('5. Pay Principal from ACTUS STO Obligor Module');
  const assetTerms = await EconomicsRegistryInstance.methods.getTerms(web3.utils.asciiToHex(assetId)).call();
  const assetState = await EconomicsRegistryInstance.methods.getState(web3.utils.asciiToHex(assetId)).call();
  const assetSchedule = await PAMEngineInstance.methods.computeProtoEventScheduleSegment(
    assetTerms,
    assetTerms.statusDate,
    assetTerms.maturityDate
  ).call();
    
  // evaluate IED ProtoEvent
  const iedEvent = await PAMEngineInstance.methods.computeNextStateForProtoEvent(
    assetTerms,
    assetState,
    assetSchedule[0],
    assetTerms.initialExchangeDate.toString()
  ).call();
  console.log(' Principal Amount: ' + web3.utils.fromWei(iedEvent[1].payoff.toString()) + ' Ether');
  
  // jump to initial exchange date
  await mineBlock(assetTerms.initialExchangeDate.toString());

  // pay principcal
  await ActusSTOInstance.methods.payPrincipal().send({ from: account_keeper });

  const payoff = await PaymentRegistryInstance.methods.getPayoff(web3.utils.asciiToHex(assetId), 1).call()  
  console.log(' Paid: ' + web3.utils.fromWei(payoff[2].toString()) + ' Ether');
  
  // progress asset state
  await AssetActorInstance.methods.progress(
    web3.utils.asciiToHex(assetId),
    assetTerms.initialExchangeDate.toString()
    ).send({ from: account_keeper });
    
    console.log(' Updated Asset State');
    console.log('');
}

// pay interest
async function payInterest () {
  console.log('6. Make Interest Payment');

  const assetTerms = await EconomicsRegistryInstance.methods.getTerms(web3.utils.asciiToHex(assetId)).call();
  const assetState = await EconomicsRegistryInstance.methods.getState(web3.utils.asciiToHex(assetId)).call();
  const assetSchedule = await PAMEngineInstance.methods.computeProtoEventScheduleSegment(
    assetTerms,
    assetTerms.initialExchangeDate,
    assetTerms.maturityDate
  ).call();  

  // evaluate IED ProtoEvent
  const ipEvent = await PAMEngineInstance.methods.computeNextStateForProtoEvent(
    assetTerms,
    assetState,
    assetSchedule[0],
    assetSchedule[0].scheduledTime
  ).call();
  console.log(' Interest Payment Amount: ' + web3.utils.fromWei(ipEvent[1].payoff.abs().toString()) + ' Ether');

  await PaymentRouterInstance.methods.settlePayment(
    web3.utils.asciiToHex(assetId),
    -5,
    3,
    '0x0000000000000000000000000000000000000000',
    ipEvent[1].payoff.abs().toString()
  ).send({ from: account_recordCreatorObligor, value: ipEvent[1].payoff.abs().toString() });

  const payoff = await PaymentRegistryInstance.methods.getPayoff(web3.utils.asciiToHex(assetId), 3).call()  
  const EtherDividendCheckpointBalance = await web3.eth.getBalance(EtherDividendCheckpointInstance.address);
  console.log(' Paid: ' + web3.utils.fromWei(payoff[2].toString()) + ' Ether');
  console.log(' Dividend Module Balance: ' + web3.utils.fromWei(EtherDividendCheckpointBalance) + ' Ether');

  await AssetActorInstance.methods.progress(
    web3.utils.asciiToHex(assetId),
    assetSchedule[0].scheduledTime
  ).send({ from: account_keeper });

  console.log(' Updated Asset State');
  console.log('');
}

// investors claim dividends
async function withdrawDividends () {
  console.log('7. Claim dividends as Investor');
  const dividends = await EtherDividendCheckpointInstance.methods.getDividendsData().call();
  const dividendIndex = dividends.names.length - 1;
  const tx = await EtherDividendCheckpointInstance.methods.pullDividendPayment(dividendIndex).send({ from: account_investor });
  console.log(' Dividend Index: ' + tx.events.EtherDividendClaimed.returnValues._dividendIndex);
  console.log(' Dividend Amount: ' + web3.utils.fromWei(tx.events.EtherDividendClaimed.returnValues._amount.toString()) + ' Ether');
  console.log(' Dividend Withheld: ' + web3.utils.fromWei(tx.events.EtherDividendClaimed.returnValues._withheld.toString()) + ' Ether');
  console.log('');
}

(async () => {
  await instantiateContracts();
  await initializeAccounts();
  await deployActusSTO();
  await deployAsset();
  await linkAssetToSTO();
  await buyTokensFromSTO();
  await payPrincipal();
  await payInterest();
  await withdrawDividends();
})();

process.on('uncaughtException', (err) => console.log(err))
