let ctx =
document.getElementById('soilChart');

let chart =
new Chart(ctx,{

type:'line',

data:{

labels:[],

datasets:[{

label:'Soil Moisture',

data:[]

}]

}

});

function addPoint(v)
{

let t=
new Date().toLocaleTimeString();

chart.data.labels.push(t);

chart.data.datasets[0].data.push(v);

if(chart.data.labels.length>20)
{
chart.data.labels.shift();

chart.data.datasets[0].data.shift();
}

chart.update();

}