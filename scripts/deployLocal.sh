#!/bin/sh

trap "exit" INT TERM
trap "printf '\nExit.\n' && kill 0" EXIT

if [ ! -d "ap-monorepo/packages/ap-contracts/node_modules" ]
then 
  echo "Dependencies missing in ap-contracts. Please install dependencies first."
  exit
fi

if [ ! -d "polymath-core/node_modules" ]
then 
  echo "Dependencies missing in polymath-core. Please install dependencies first."
  exit
fi

printf "Running ganache-cli ...\n\n"
{ 
	ganache-cli -i 1994 -e 5000000000 --gasLimit 8000000 -d -m "helmet copy pause hood gun soon fork drum educate curious despair embrace"
} 1>/dev/null &

sleep 1

echo "Deploying ACTUS Protocol contracts ..."
(
  cd ap-monorepo/packages/ap-contracts
  truffle migrate --reset --network development
) 1>/dev/null

echo "Deploying Polymath contracts ..."
(
  cd polymath-core
  yarn migrate:local
) 1>/dev/null


printf "\nMigration successful! Blockchain running at http://127.0.0.1:8545. Hit ^C to stop ganache-cli.\n"

while true; do sleep 1; done
