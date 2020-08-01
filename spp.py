# coding=utf8
import numpy as np
from datetime import datetime
import smtplib
import time
from selenium import webdriver

#For Prediction
from sklearn.linear_model import LinearRegression
from sklearn import preprocessing, svm
from sklearn.model_selection import cross_validate

#For Stock Data
from iexfinance.stocks import Stock
from iexfinance.stocks import get_historical_data

import requests
from bs4 import BeautifulSoup

def getStocks(n):
    #Navigating to the Yahoo stock screener

    url = 'https://finance.yahoo.com/screener/predefined/aggressive_small_caps?offset=0&count=202'

    stock_list = []

    response = requests.get(url)

    soup = BeautifulSoup(response.text, features="html.parser")

    table = soup.find_all('table')[0] # Grab the first table
    table_body = table.find('tbody')

    for row in table_body.findAll("tr"):
        cells = row.findAll("td")
        if len(cells) == 10:
            anchor = cells[0].find("a")
            stock_list.append(anchor.contents[0])
            
    print(stock_list)



getStocks(200)