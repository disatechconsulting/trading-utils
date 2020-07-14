#!/bin/bash

display_usage() {
    echo " ----------------------------- Trading Utilities Help Menu --------------------------------------"
    echo "| Please run script by providing:"
    echo "|       Ticker: The stock symbol"
    echo "|       Total $ cost: Total cost willing to spend on this position. Should be no more then 5% of your overall equity"
    echo "|       Entry Price: First purchase share cost. Average of the 'Avg low' for 40,20,5 days"
    echo "|       % Down: Percentage loss to trigger next DCA purchase"
    echo "|       Number of DCA transactions: Max number of purchases to do to do DCA after initial purchase"
    echo "|       % Stop loss: Stop loss percentage from current average share price"
    echo "|       Exit Price: The exit price, if prices were climbing on your entry share cost"
    echo "| Usage Example: ./dca.sh JWN 2889.25 17.98 10 3 10 19.50"
    echo " ------------------------------------------------------------------------------------------------"
}

if [[ ( $1 == "--help" ) || ( $1 == "-h") ]]
    then
       echo ""
       echo "    -------------------------------- help menu ---------------------------------"
       echo ""
       echo "                                  -h: help "
       echo "                              --help: help"
       echo "     <ticker> <total cost> <entry price> <% down> <number transactions> <% stop loss> <exit price>: display DCA setup plan" 
       echo ""
       exit 1
fi

if [ $# -le 1 ] # if less than two arguments supplied, display help
    then
        display_usage
        exit 1
    else 
        echo $2
        node dca.js $1 $2 $3 $4 $5 $6 $7
fi