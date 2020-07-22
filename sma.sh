#!/bin/bash

display_usage() {
    echo " ----------------------------- Trading Utilities Help Menu --------------------------------------"
    echo "| You need to provide a ticker symbol and the days range separated by comma, up to 3             |"
    echo "| Usage: ./sma.sh WFC 30,15,5                                                                    |"
    echo " ------------------------------------------------------------------------------------------------"
}

if [[ ( $1 == "--help" ) || ( $1 == "-h") ]]
    then
       echo ""
       echo "    -------------------------------- help menu ---------------------------------"
       echo ""
       echo "                                  -h: help "
       echo "                              --help: help"
       echo "     <ticker> <range1,range2,range3>: display the SMA for ticker in the 3 ranges" 
       echo ""
       exit 1
fi

if [ $# -le 1 ] # if less than two arguments supplied, display help
    then
        display_usage
        exit 1
    else 
        node sma.js $1 $2
fi