// JavaScript for Solar Data Demo
// Jim Skon, Kenyon College, 2023
// Using https://github.com/chartjs/Chart.js
// https://docs.google.com/document/d/1pqFQTzzB-4UMoq2QJ0riP21jfa7wyFhNyYf97Hwgo0Y/edit
const Url="http://belize.expertlearningsystem.org/Knowledge/?SessionID=1234567890:9999";
const Sites="&Query=SolarNames()";
const Watts="&Query=SolarWatts()";
const AllWatts="&Query=SolarWatts(*)";
const siteDayWatts="&Query=SolarHistory(%SITE%,qWattsmin1,%DATE%*)";
const siteInfo="&Query=SolarInfo(%SITE%)"
const allSitesDayWatts="&Query=SolarHistorySummary(*,qHistoryWattsHour1,%DATE%*)";
const SolarWattsAverageDay="&Query=SolarWattsAverageDay(8B0C4C,%DATE%"
const SolarWattsAllDayAllSites="&Query=SolarWattsAllDayAllSites(%DATE%*)";
// &Query=SolarHistory(8B0AB1,qWattsmin1,2023-02-02*)
// &Query=SolarHistory(SITE,qWattsmin1,DATE*)
console.log("Start!");
const ErrSrv = '<p style="color:red">Error reading from server';
const QueryErr = '<p style="color:red">ErQuery failed';
const hourlabels = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];





//gives query of watts each min, of each hour.
//http://belize.expertlearningsystem.org/Knowledge/?SessionID=1234567890:9999&Query=SolarHistory(6DC854,qWattsmin1,2023-02-20%2014*)

// actually.. I found this.
// gives query of average watts each hour.
// http://belize.expertlearningsystem.org/Knowledge/?SessionID=1234567890:9999&Query=SolarHistory(6DC854,qWattsHour1,2023-03-01%2010*)
const wEachHr = "&Query=SolarHistory(%SITE%,qWattsHour1,%DATE%*)";



var siteMap = {};  // A global place to store MAC to School name map
var summaryChart = 0;
var summaryWhrChart = 0;


// Add an event listener for each item in the pull down menu
function updateSiteList() {
document.querySelectorAll('.dropdown-menu a').forEach(item => {
    item.addEventListener('click', event => {
		var element = event.target;
		var site=element.textContent;

		siteMAC = element.getAttribute("value");
		console.log("pick: "+site+" "+siteMAC);
		// Get the pulldown parent
		var pullDown = element.parentElement.parentElement;
		// Get and set the selection displayed
		var selection = pullDown.querySelectorAll(".selection")[0];
		selection.innerHTML = site;
		if (site == "All") {
			getSitesWatts();
			return;
		}
		getSiteInfo(siteMAC);
		
    })
})
}
// Start things off by getting site list information
getSites();

function clearOutput() {
	document.querySelector('#output').innerHTML = "";

}
// Todays date in for yyyy-mm-dd
function todaysDate() {
	var today = new Date();
	var dd = String(today.getDate()).padStart(2, '0');
	var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
	var yyyy = today.getFullYear();
	var date = yyyy +'-'+ mm +'-'+ dd;
	return date;
	
}

// Get time from date
function getTime(date) {
	var time = date.substr(-8);
	time = time.substring(0,5);
	return time;
}

// Get last 6 characters of MAC
function shortMAC(MAC) {
	var short = MAC.substr(-6);
	return short;

}
// Process call to get all site names and MAC addresses
function processSites(results) {
	if (!results["success"]) {
		document.querySelector('#output').innerHTML = ErrQuery+": get sites";
		return;
	}
	//var table = siteTable(results['message']);
    //document.querySelector('#output').innerHTML = table;
    data=results['message'];
    siteDropdown(data);
    updateSiteList();  // Create dropdown list
    siteMap = data; // Save map of MAC addressed to site names
    // Get and display live watts for each active site.
    getSitesWatts();

}

// Make call to fetch all site names and MAC addresses
function getSites() {
	// Clear the previous results
    document.querySelector('#output').innerHTML = "";
    fetch(Url+Sites, {
	method: 'get'
    })
	.then (response => response.json() )
        .then (data => processSites(data))
	.catch(error => {
	    document.querySelector('#output').innerHTML = ErrSrv+": get sites";
	})

}


// Build site name dropdown menu from site data
function siteDropdown(data) {
    var dropdown = '<a class="dropdown-item" href="#" value="0">All</a>';
    for(var key in data) {
		dropdown += '<a class="dropdown-item" href="#" value="'+key+'">'+data[key]+'</a>';
    };
    
    document.querySelector('#searchtype').innerHTML = dropdown;

    return;
}

// Process the live watt data for all sites and build graph
function processSitesWatts(results) {
	if (!results["success"]) {
		document.querySelector('#output').innerHTML = ErrQuery+": Get all site's watts";
		return;
	}

	today = todaysDate();

	dataList = results['message'];
	wattsData = [];
	wattsLabel = [];
	dataList.forEach(function(site) {
		siteDate = site[2].split(" ")[0];
		if (parseInt(site[1])>0 && siteDate == today) {
			wattsData.push(site[1]);
			wattsLabel.push(siteMap[site[0]]);
		}
	});
	document.querySelector('#output').innerHTML = "<h1>Belize Solar Live Data</h1>";
	// Display graph
	makeLiveSummaryGraph(wattsLabel,wattsData);
	getAllSiteTodayWatts();

}

// Get watt data for all sites, then display graph
function getSitesWatts() {

    fetch(Url+AllWatts, {
	method: 'get'
    })
	.then (response => response.json() )
        .then (data => processSitesWatts(data))
	.catch(error => {
	    document.querySelector('#output').innerHTML = ErrSrv+": Get all site's watts";
	})

}

// Build watt output table 
function wattTable(data) {
    var table = '<table class="w3-table-all w3-hoverable" border="2"><tr><th>Time</th><th>Watts</th><tr>';
	//console.log(JSON.stringify(data));
	var prev = -1
	data.forEach ( function(row) {
		var time = getTime(row[2]);
		var watts = row[3];
		if (prev != 0 || parseInt(watts) != 0) {
			table += "<tr><td>"+time+"</a>";
			table+="</td><td>"+watts+"</td></tr>";
		}
		prev = parseInt(watts);
    });
    table += "</table>";

    return table;
} 

// Sum up array, ignoreing nulls
function sumArray(a) {
	sum = 0;
	a.forEach(function(w) {
		if (w!=null) {
			sum+=parseInt(w);
		}
	});
	return sum;
}

// Build data for a graph of total watts for today
function displayAllSiteTodayWatts(data){
	var names = [];
	var whrs = [];
	//console.log(JSON.stringify(siteMap));
	data.forEach(function(site) {
		var MAC = site.shift();
		var wattsList = site;
		var whr = sumArray(wattsList);
		
		if (whr > 0) {
			//console.log(MAC,siteMap[MAC],whr);
			names.push(siteMap[MAC]);
			whrs.push(whr);
		}
		
	});
	console.log(JSON.stringify(names),JSON.stringify(whrs));
	makeSumSummaryGraph(names,whrs);
}

// Process All Site watts by hour for that day
function processAllSiteTodayWatts(results) {
	if (!results["success"]) {
		document.querySelector('#output').innerHTML = QueryErr+"Get all sites watts for today";
		return;
	}
	//clearCanvas();
	var data = results['message'];
	
	//console.log(JSON.stringify(data));
	document.querySelector('#output2').innerHTML += "<h1>Total Kilowatts today</h1>";
	displayAllSiteTodayWatts(data);
}

// Get All Site watts by hour for that day
function getAllSiteTodayWatts() {
	var command=Url+SolarWattsAllDayAllSites;
	command=command.replace("%DATE%",todaysDate());
	console.log(command);
	fetch(command, {
		method: 'get'
    	})
		.then (response => response.json() )
        	.then (data => processAllSiteTodayWatts(data))
		.catch(error => {
	    	document.querySelector('#output').innerHTML = ErrSrv+" Get all sites watts for today";
		})
}

// Process the Site watts by hour for that day
function processSiteDailyWatts(results) {
	if (!results["success"]) {
		document.querySelector('#output').innerHTML = QueryErr+" Get sites watts for today";
		return;
	}
	//clearCanvas();
	var data = results['message'];
	//console.log(JSON.stringify(data));
	document.querySelector('#output').innerHTML += wattTable(data);
}

// Get the Site watts by minute for that day
function getSiteDailyWatts(siteMAC) {
	var MAC = shortMAC(siteMAC);
	var command=Url+siteDayWatts;

	command=command.replace("%SITE%",MAC);
	command=command.replace("%DATE%",todaysDate());
	fetch(command, {
		method: 'get'
    	})
		.then (response => response.json() )
        	.then (data => processSiteDailyWatts(data))
		.catch(error => {
	    	document.querySelector('#output').innerHTML = QueryErr+" Get sites watts for today";
		})
}

// Process and display the Site info
function processSiteInfo(results) {
	if (!results["success"]) {
		document.querySelector('#output').innerHTML = ErrSrv+"11";
		return;
	}
	var data = results['message'];
	//console.log(JSON.stringify(data));
	var output = "<h1>"+data['name']+"</h1>";
	output += "<p><b>Location:</b> <i>"+data['location']+"</i> <b>Contact:</b> <i>"+data['contactName']+"</i>";
	output += " <b>Email:</b> <i>"+data['contactEmail']+"</i> </p>";
	output += "<p><b>Panels:</b> <i>"+data['numPanels']+"</i> <b>Limiter:</b> <i>"+data['limiter']+"</i></p>";
	document.querySelector('#output').innerHTML = output;
	destroySummaryChart();
	getSiteDailyWatts(siteMAC);
	
}

// Get the Site info given the site MAC address
function getSiteInfo(siteMAC) {
	var MAC = shortMAC(siteMAC);
	var command=Url+siteInfo;

	command=command.replace("%SITE%",MAC);
	fetch(command, {
		method: 'get'
    	})
		.then (response => response.json() )
        	.then (data => processSiteInfo(data))
		.catch(error => {
	    	document.querySelector('#output').innerHTML = ErrSrv+"10!";
		})
}

// Remove summary chart
function destroySummaryChart() {
	summaryChart.destroy();
	summaryChart = 0;	
}

// Create and display a bar graph of live data for all sites.
function makeLiveSummaryGraph(names,watts) {
	
  const ctx = document.getElementById('chart');
  
  if (summaryChart) destroySummaryChart();
	
  summaryChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: names,
      datasets: [{
        label: 'Live Watts',
        data: watts,
        borderWidth: 1
      }]
    },
    options: {
      //indexAxis: 'y',
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });

}

// Remove whatt hour chart
function destroyWhrChart() {
	summaryChart.destroy();
	summaryChart = 0;	
}

// Create and display a bar graph of total killowatts today all sites.
function makeSumSummaryGraph(names,watts) {
	
  const ctx = document.getElementById('chart2');
  
  if (summaryWhrChart) destroyWhrChart();
	
  summaryWhrChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: names,
      datasets: [{
        label: 'Kilowatt hours',
        data: watts,
        borderWidth: 1
      }]
    },
    options: {
      //indexAxis: 'y',
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}


// I'll try again.


// data for hourly graph.

// Get the Site watts by hour for that day
function getSiteDailyWatts(siteMAC) {
	var MAC = shortMAC(siteMAC);
	var command=Url+wEachHr;

	command=command.replace("%SITE%",MAC);
	command=command.replace("%DATE%",todaysDate());
	fetch(command, {
		method: 'get'
    	})
		.then (response => response.json() )
        	.then (data => processSiteDailyHourlyWatts(data))
		.catch(error => {
	    	document.querySelector('#output').innerHTML = QueryErr+" Get sites watts for today";
		})
}

// a function that returns an array containing all hours during which watts were recorded for a school throughout the day
function processSiteDailyHourlyWatts(data) {
        var prev = -1
        let dWatts = [];
        let dHour= []
        data.forEach ( function(row) {
                // var time = hourlabels(row[2]);
                var watts = row[3];
                if (prev != 0 || parseInt(watts) != 0) {
                // dWatts.push(parseInt(time));
                        dWatts.push(parseInt(watts));
                }
                prev = parseInt(watts);
    });
    return dWatts;
}



/*
function getDailyWattsHours(siteMAC) {
	var MAC = shortMAC(siteMAC);
	var commandEachHour = Url+wEachHr;
	var dataEachHour = results['message'];
	
	commandEachHour=commandEachHour.replace("%SITE%,MAC");
	commandEachHour=commandEachHour.replace("%DATE%,todaysDate()");
	
	console.log(commandEachHour);
	fetch(commandEachHour, {
		method: 'get'
	})
	.then (responseEachHour => responseEachHour.json())
	.then (dataEachHour => processSiteDailyHourlyWatts(dataEachHour))
	.catch (error => {document.querySelector('#output').innerHTML = QueryErr+" Get sites watts for today";
		})
}
*/



/*function processSiteDailyHourlyWatts(results) {
	if (!results["success"]) {
		document.querySelector('#output').innerHTML = QueryErr+" Get sites watts for today";
		return;
	}
	
	wattsData1 = [];
	wattsLabel1 = hourslabels;
	
	for 
	
	/*today = todaysDate();
	
	dataList = results['message'];
	wattsData = [];
	wattsLabel = hourslabels;
	dataList.forEach(function(hour) {
		siteHour = site[3].split(" ")[0];
		wattsData.push(site[1]);
	}); */
/*
	// var datalabel = hourlabels;
	
	document.querySelector('#output3').innerHTML += "<h1>Today's hourly watts</h1>";
	makeLineGraphDailyWatts(wattsLabel,wattsData);
	getDailyWattsHours();
}
*/

function makeLineGraphDailyWatts(hourlabels,watts) {
   const ctx = document.getElementById('chart3');
   if (summaryChart) destroySummaryChart();
	
   summaryChart = new Chart(ctx, {
	   type: 'line',
	   data: {
		labels: names, //add up & divide by 60 -- that's watthours.    run query in the html bar first. if it returns in the form you want it to, then move onto the actual graph.
		datasets: [{
		   label: 'kilowatts for current day',
		   data: watts,
		   fill: false,
		   borderColor: 'rgb(197, 214, 69)',
		   borderWidth: 0.1
		}]
	   },
	   options: {
      //indexAxis: 'y',
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}
   

// Remove whatt hour chart
/*function destroyWhrChart() {
	summaryChart.destroy();
	summaryChart = 0;
*/


// Create and display a line graph of hourly killowatts of current day.
/*
function makeLineGraphDailyWatts(label,watts) {
   const ctx = document.getElementById('chart3');
	
   if (summaryChart) destroySummaryChart();

   console.log(JSON.stringfy(hourlabels),JSON.stringfy(watts));
   summaryChart = new Chart(ctx, {
	   type: 'line',
	   data: {
		labels: hourlabels, //add up & divide by 60 -- that's watthours.    run query in the html bar first. if it returns in the form you want it to, then move onto the actual graph.
		datasets: [{
		   label: 'kilowatts for current day',
		   data: watts,
		   fill: false,
		   borderColor: 'rgb(197, 214, 69)',
		   tension: 0.1
		}]
	   },
	   options: {
      //indexAxis: 'y',
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}
*/
