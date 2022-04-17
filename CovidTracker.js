import { LightningElement, track } from 'lwc';

let initialValue ={
    total_deaths : 0,
    total_confirmed : 0,
    total_active : 0,
    total_recovered :0,
    total_fatality_rate : 0,
  total_recovery_rate : 0
  }
const URL = "https://services9.arcgis.com/N9p5hsImWXAccRNI/arcgis/rest/services/Z7biAeD8PAkqgmWhxG2A/FeatureServer/1/query?f=json&where=Confirmed%20%3E%200&outFields=Country_Region,Confirmed,Deaths,Recovered,Last_Update,Active&orderByFields=Confirmed%20desc"
export default class App1 extends LightningElement {

    @track total=initialValue;
    @track defaultView = 'LIST'
    @track showListView=true
    tableData=[];
    filteredTableData=[];
    get isListSelected(){
        return this.defaultView==='LIST'?'active':''
    }
    get isChartSelected(){
        return this.defaultView==='CHART'?'active':''
    }
    connectedCallback(){
        this.fetchData()
    }
    async fetchData(){
        let response=await fetch(URL);
        let data=await response.json();
        this.formatData(data);
    }
    formatData(result){
        let individualSum={};
        result.features.forEach(data => {
            let item=data.attributes;
            let obj = {
                Confirmed: item.Confirmed,
                Active: item.Active,
                Deaths: item.Deaths,
                Recovered: item.Recovered,
                Last_Update:item.Last_Update
              }
            //console.log(item);
            if(item.Country_Region in individualSum){
                individualSum[item.Country_Region].Confirmed+=obj.Confirmed;
                individualSum[item.Country_Region].Active+=obj.Active;
                individualSum[item.Country_Region].Deaths+=obj.Deaths;
                individualSum[item.Country_Region].Recovered+=obj.Recovered;
            }
            else{
                individualSum[item.Country_Region]=obj
            }
            this.total.total_deaths += item.Deaths;
            this.total.total_confirmed += item.Confirmed;
            this.total.total_active += item.Active;
            this.total.total_recovered += item.Recovered;
        })

        this.total.total_fatality_rate=this.getFRate().toFixed(2)+'%';
        this.total.total_recovery_rate=this.getRRate().toFixed(2)+'%';
        //console.log(individualSum);
        let finalData=Object.keys(individualSum).map(key=>{
            let value=individualSum[key]
            let Fatality_rate=this.getFRate(value).toFixed(2)+'%';
            let Recovery_rate=this.getRRate(value).toFixed(2)+'%';

            let activeColumnClass =  value.Recovered < value.Active ? "activeColumnClass" : "" 
            let recoveredColumnClass = value.Recovered > value.Active ? "recoveredColumnClass" : ""
            let fatalityColumnClass = this.getFRate(value) > this.getFRate() ? "fatalityColumnClass-danger" : this.getFRate(value) < this.getFRate() ? "fatalityColumnClass-success":""
            let recoveryColumnClass = this.getRRate(value) > this.getRRate() ? "recoveryColumnClass-success" : this.getRRate(value) < this.getRRate() ? "recoveryColumnClass-warning":""

            return{...value,"Fatality_rate":Fatality_rate, "Recovery_Rate":Recovery_rate,"Country_Region":key,
            "activeColumnClass":activeColumnClass,
            "recoveredColumnClass":recoveredColumnClass,
            "fatalityColumnClass":fatalityColumnClass,
            "recoveryColumnClass":recoveryColumnClass}
        })
        //console.log(JSON.stringify(finalData))
        this.tableData=[...finalData];
        this.filteredTableData=[...finalData];
    }
    getFRate(value){
        if(value){
            return ( value.Deaths/value.Confirmed)*100
        }
        else{
            return ( this.total.total_deaths/this.total.total_confirmed)*100
        }
    }
    getRRate(value){
        if(value){
            return ( value.Recovered/value.Confirmed)*100
        }
        else{
            return (this.total.total_recovered/this.total.total_confirmed)*100
        } 
    }

    listHandler(event){
        this.defaultView=event.target.dataset.name;
        if(this.defaultView==='LIST'){
            this.showListView=true;
            
        }
        else{
            this.showListView=false;
            
        }
    }

    searchHandler(event){
        //console.log(event.target.value);
        if(event.target.value.trim()){
            let filterData=this.tableData.filter(data=>{
                let country= data.Country_Region.toLowerCase();
                console.log(JSON.stringify(country));
                return country.includes(event.target.value.toLowerCase())
            })
            this.filteredTableData=[...filterData]
        }
        else{
            this.filteredTableData=[...this.tableData]
        }
    }
}