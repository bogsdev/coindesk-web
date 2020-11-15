import React, { Component } from 'react';
import * as SignalR from '@aspnet/signalr';
import moment from 'moment';
import 'fontsource-roboto';
import Card from '@material-ui/core/Card';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import CanvasJSReact from '../assets/canvasjs.react';
var CanvasJSChart = CanvasJSReact.CanvasJSChart;

export class BitcoinPricelist extends Component {
  constructor(props) {
    super(props);

    this.state = {
      prices: [],
      hubConnection: null,
    }
  }

  componentDidMount = async () => {
    const prices = await this.LoadInitialValues();
    prices.forEach(recievedPrice => {
      const bitconPrice = recievedPrice.bitcoinValue;
      const ethereumPrice = recievedPrice.ethereumValue;
        const date = new Date( Date.parse(recievedPrice.date));
      const prices = this.state.prices;
      prices.push([bitconPrice, ethereumPrice, date]);
      this.setState({ prices: prices });
    });

    this.InitialiseHub();
  }

  LoadInitialValues = async () => {
    const response = await fetch("https:///localhost:5001/Coinbase", {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      redirect: 'follow', // manual, *follow, error
      referrerPolicy: 'no-referrer', // no-referrer, *client
    });

    return await response.json();
  };

  InitialiseHub = () => {
    const hubConnection = new SignalR.HubConnectionBuilder().withUrl("https:///localhost:5001/btchub").build();

    this.setState({ hubConnection }, () => {
      this.state.hubConnection
        .start()
        .then(() => console.log('Connection started!'))
        .catch(err => console.log('Error while establishing connection :('));

      this.state.hubConnection.on('ReceivePrice', (recievedPrice) => {
        const bitconPrice = recievedPrice.bitcoinValue;
        const ethereumPrice = recievedPrice.ethereumValue;
        const date = new Date( Date.parse(recievedPrice.date));
        const prices = this.state.prices;
        if (prices.length === 5) {
          prices.shift();
        }
        prices.push([bitconPrice, ethereumPrice, date]);
        this.setState({ prices: prices });
      })
    })
  }


  render() {
    const prices = this.state.prices;
    const options = {
      theme: "light2",
      animationEnabled: true,
      title: {
        text: "Bitcoin and Ethereum Prices to NZD"
      },
      toolTip: {
        shared: true
      },
      axisY: {
				includeZero: false,
				prefix: "$"
			},
      data: [
      {
        type: "line",
        name: "Bitcoin",
        showInLegend: true,
        yValueFormatString: "$#,###.##",
        dataPoints: prices.reverse().map(price => ({x: price[2], y: price[0]}))
      },
      {
        type: "line",
        name: "Ethereum",
        showInLegend: true,
        yValueFormatString: "$#,###.##",
        dataPoints: prices.reverse().map(price => ({x: price[2], y: price[1]}))
      }
      ]
    }

    return (
    <div>
      <CanvasJSChart options = {options}/>
    </div>
    );
  }
}
