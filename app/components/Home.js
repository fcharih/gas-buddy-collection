// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import routes from '../constants/routes.json';
import styles from './Home.css';
const { dialog } = require("electron").remote;
const { clipboard } = require('electron')
const ipc = require('electron').ipcRenderer;

type Props = {};

export default class Home extends Component<Props> {
	props: Props;

	state = {
	  file: "",
		data: null,
		index: 0,
		stationIndex: 0
	}

	async seek(which) {
		const navigator = document.querySelector('webview');
		if(which === "next") {
		  const index = `${parseInt(this.state.index) + 1}`;
			this.setState({ index })
		} else {
			const index = `${parseInt(this.state.index) - 1}`;
			this.setState({ index  })
		}
		await navigator.executeJavaScript("document.querySelector('#share-button').click()")
	}

	async componentDidMount() {
		const webview = document.querySelector('webview')
		webview.addEventListener('did-stop-loading', async () => {
			await webview.executeJavaScript("document.querySelector('#click-to-view').click()")
		});
	}

	async saveLink() {
		const navigator = document.querySelector('webview');
		const contents = await navigator.getWebContents();
		await navigator.executeJavaScript("document.querySelector('#share-button').click()")
		const gmapsLink = await navigator.executeJavaScript("document.querySelector('#img-link').value");
		const isvLink = contents.getURL();
		const data = JSON.parse(JSON.stringify(this.state.data));
	  data[this.state.index].nearbyStations.results[this.state.stationIndex].isvLink = isvLink;
		data[this.state.index].nearbyStations.results[this.state.stationIndex].gmapsLink = gmapsLink;
		let newData = await ipc.invoke("save-data", data);
		this.setState({ data: {...newData} });

		if(this.state.stationIndex !== this.state.data[this.state.index].nearbyStations.results.length - 1) {
		  this.setState({ stationIndex: this.state.stationIndex + 1 })
		} else {
			await this.setState({ stationIndex: 0, index: `${parseInt(this.state.index) + 1}` });
		}
	}

	async badLink() {
		const data = JSON.parse(JSON.stringify(this.state.data));
	  data[this.state.index].nearbyStations.results[this.state.stationIndex].isvLink = "NA";
	  data[this.state.index].nearbyStations.results[this.state.stationIndex].gmapsLink = "NA";
		let newData = await ipc.invoke("save-data", data);
		this.setState({ data: {...newData} });
		if(this.state.stationIndex !== this.state.data[this.state.index].nearbyStations.results.length - 1) {
		  this.setState({ stationIndex: this.state.stationIndex + 1 })
		} else {
			await this.setState({ stationIndex: 0, index: `${parseInt(this.state.index) + 1}` });
		}
	}

	async setFile() {
		const filepath = dialog.showOpenDialogSync({ properties: ["openFile"]  });
		await ipc.invoke("select-file", filepath[0]);
		this.setState({ file: filepath  });
		const data = await ipc.invoke("get-data", null);
		console.log(data)
		this.setState({ data: {...data} });

		// Identify first empty photo
		const index = 
		Object.keys(this.state.data).filter((key) => this.state.data[key].nearbyStations.results.every(station => !station.gmapsLink))[0];
		console.log("=>", index)
		this.setState({ index });
	}

	getInstantViewUrl() {
		if(!this.state.data) return null;
		console.log(this.state.data[this.state.index].nearbyStations.results[this.state.stationIndex])
		const lat = this.state.data[this.state.index].nearbyStations.results[this.state.stationIndex].geometry.location.lat;
		const lng = this.state.data[this.state.index].nearbyStations.results[this.state.stationIndex].geometry.location.lng;
		const url = `https://www.instantstreetview.com/@${lat},${lng},0h,0p,0z`;
		return url;
	}

	imageAvailableForLink(linkIndex) {
		return this.state.data[this.state.index].nearbyStations.results[linkIndex].gmapsLink;
	}

	render() {

	if(!this.state.file) {
	return (

			<div data-tid="container">
				<h1>GasBuddy Image Collection Tool</h1>
				<div>Please select the JSON file where the links are to be stored.</div>
				<button onClick={this.setFile.bind(this)}>Select file</button>
			</div>
	)
	}

	if(this.state.file) {
    return (
			<div data-tid="container">
				<h1>GasBuddy Image Collection Tool</h1>
				<div class="big">Data stored in: {this.state.file}</div>
				{this.state.data && <div class="big">Link {this.state.index} out of {this.state.data && Object.keys(this.state.data).length}
				{this.state.data && <span style={{ color: `${this.state.data[this.state.index].googleMapsUrl ? 'green' : "red"}`  }}>
					{(this.state.data[this.state.index].googleMapsUrl ? " (Link retrieved)" : " (Link not retrieved)")}
				</span>}
			</div>}
				<webview 
				onClick={e => e.preventDefault()}
				style={{ height: "500px", width: "800px", margin: "0 auto"}}
			  src={this.getInstantViewUrl()}
			/>
					{this.state.data && <div style={{ display: "flex", justifyContent: "space-around"  }}>{this.state.data[this.state.index].nearbyStations.results.map((result, i) => (
					<div style={{ color: `${this.imageAvailableForLink(i) ? "green" : "red"}`, textDecoration: `${ i === this.state.stationIndex ? "underline" : "" }` }} onClick={() => this.setState({ stationIndex: i })}>Link {i}</div>
					))}
				</div>}
				<div className="btt">
					<button onClick={() => this.seek('prev')}>Prev</button>
					<button onClick={this.saveLink.bind(this)}>Save link</button>
					<button onClick={this.badLink.bind(this)}>Bad link</button>
					<button onClick={() => this.seek('next')}>Next</button>
				</div>
      </div>
		);
		}
  }
}
