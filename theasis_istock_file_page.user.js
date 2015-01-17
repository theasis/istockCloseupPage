// ==UserScript==
// @name           iStock Image Page Fixes
// @namespace      theasis
// @version	   1.0.4
// iStockPhoto browser script (c) Martin McCarthy 2014
// ==/UserScript==
// This script fixes things on the image page
//
// 21 March 2014 Martin McCarthy
// v1.0.0 First public release
// 29 May 2014 Martin McCarthy
// v1.0.1 Fixes for URL changes
// 16 January 2015 Martin McCarthy
// v1.0.2 Download details
// v1.0.3 Fix DL details for Video (no PP) and Audio (no PP or GI)
// 17 January 2015 Martin McCarthy
// v1.0.4 Include latest sale date in the download details

var isVideo=false;
var isAudio=false;

function main() {
	doStyle = function () {
		var el = jQ("#theasis_imagePage_style");
		if (el.length<1) {
			jQ("<style type='text/css' id='theasis_imagePage_style'>.theasis_btnCta1 { font-size: 85%; padding: 3px 7px; float: right;} .theasis_detailsTable tr { border: 1px dotted #02a388; } .theasis_detailsTable td:first-child { padding: 2px 7px 2px 7px;} .theasis_detailsTable td { font-size: 85%; padding: 2px 7px 2px 7px;} .theasis_dlDetlailsTable_row_a { background-color:#a2e3d8; }</style>").appendTo("head");
		}
	};
	
	loadDetails = function(dlType,dlTarget,dateTarget,id) {
		var url='http://www.istockphoto.com/file_downloads.php?id='+id+'&order=Date&PageSetting='+dlType;
		jQ.ajax(url)
			.done(function(data) {
				var html=jQ(data);
				var dispText=jQ("div.paginator:first div.fl",html).text();
				var numMatch = dispText.match(/of\s+(\d+)\s+match/);
				var result=0;
				var lastSale="";
				if (numMatch) {
					result=parseInt(numMatch[1]);
					lastSale=jQ("div.rnd table tr:eq(1) td:eq(0)",html).text();
					if (lastSale.match(/^\s*$/)) {
						lastSale=jQ("div.rnd table tr:eq(1) td:eq(1)",html).text();
					}
					var match = lastSale.match(/(\d+\/\d+\/\d+)/);
					if (match) {
						lastSale=match[1];
					} else {
						lastSale="??";
					}
				}
				jQ("#"+dlTarget).text(result);
				jQ("#"+dateTarget).text(lastSale);
				var totalContainer=jQ("#theasis_dlDetails_total");
				var total=parseInt(totalContainer.text())+result;
				totalContainer.html("<b>"+total+"</b>");
			})
			.fail(function() { jQ("#"+target).text("--"); });
	};
	
	showDlDetails = function(id) {
		jQ("#theasis_dlDetailsButton").remove();
		var dlCountContainer = jQ("#downloads-count");
		var originalDLs=dlCountContainer.text();
		var img="<img src='http://i.istockimg.com/static/images/loading.gif' style='width: 10px; height: 10px;'/>";
		var dlTable=jQ("<table id='theasis_dlDetlailsTable' class='theasis_detailsTable'>"
					+ "<tr class='theasis_dlDetlailsTable_row_a'><td>Roughly</td><td>"+originalDLs+"</td><td></td></tr>"
					+ "<tr class='theasis_dlDetlailsTable_row_b'><td>Regular DLs</td><td id='theasis_dlDetails_regular'>"+img+"</td><td id='theasis_dlDetails_regular_date'></td></tr>"
					+ "<tr class='theasis_dlDetlailsTable_row_a'><td>Subs</td><td id='theasis_dlDetails_subs'>"+img+"</td><td id='theasis_dlDetails_subs_date'></td></tr>"
					+ "<tr class='theasis_dlDetlailsTable_row_b'><td>ELs</td><td id='theasis_dlDetails_els'>"+img+"</td><td id='theasis_dlDetails_els_date'></td></tr>"
					+ "<tr class='theasis_dlDetlailsTable_row_a'><td>Partner</td><td id='theasis_dlDetails_pp'>"+((isVideo||isAudio)?"--":img)+"</td><td id='theasis_dlDetails_pp_date'></td></tr>"
					+ "<tr class='theasis_dlDetlailsTable_row_b'><td>Getty</td><td id='theasis_dlDetails_gi'>"+(isAudio?"--":img)+"</td><td id='theasis_dlDetails_gi_date'></td></tr>"
					+ "<tr class='theasis_dlDetlailsTable_row_a'><td><b>Total</b></td><td id='theasis_dlDetails_total'>0</td><td></td></tr>"
					+ "</table>");
		dlCountContainer.html(dlTable);
		loadDetails('','theasis_dlDetails_regular','theasis_dlDetails_regular_date',id);
		loadDetails('Subscriptions','theasis_dlDetails_subs','theasis_dlDetails_subs_date',id);
		loadDetails('ExtendedLicense','theasis_dlDetails_els','theasis_dlDetails_els_date',id);
		if (!isVideo && !isAudio) {
			loadDetails('PartnerProgram','theasis_dlDetails_pp','theasis_dlDetails_pp_date',id);
		}
		if (!isAudio) {
			loadDetails('GISales','theasis_dlDetails_gi','theasis_dlDetails_gi_date',id);
		}
	};
	
	doButtons = function() {
		var path=location.pathname;
		var href=location.href;
		var idArray=href.match(/(\d+)/);
		var closeupPage=path.match(/^\/(stock-|photo\/|video\/|vector\/|audio\/)/)!=null;
		var editPage=path.match(/^\/file_closeup_edit/)!=null;
		var dlPage=path.match(/^\/file_downloads/)!=null;
		isVideo=path.match(/^\/video\//)!=null;
		isAudio=path.match(/^\/audio\//)!=null;
		var container=null;
		if (closeupPage) {
			var adminLink=jQ("#metadata-and-admin a[href^='/manage/file-closeup']");
			if (adminLink.length>0) {
				container=adminLink.parent();
			}
		} else if (editPage || dlPage) {
			var head=jQ("#wrapper div.fullPage h1:first");
			if (head.length>0) {
				container=jQ("<div>");
				head.after(container);
			}
		}
		if (container && idArray) {
			var id=idArray[1];
			var dlCountContainer = jQ("#downloads-count");
			if (dlCountContainer.length>0) {
				dlCountContainer.append(jQ("<button class='btnCta1 theasis_btnCta1' id='theasis_dlDetailsButton'>Details</button>").click(function(){showDlDetails(id);}));
			}
			container.append(jQ("<button class='btnCta0 theasis_btnCta1'>Deactivate</button>").click(function(){location.href="/file_status_change.php?id="+id}));
			if (!dlPage) {
				container.append(jQ("<button class='btnCta1 theasis_btnCta1'>DL History</button>").click(function(){location.href="/file_downloads.php?id="+id}));
			}
			if (!editPage) {
				container.append(jQ("<button class='btnCta1 theasis_btnCta1'>Edit</button>").click(function(){location.href="/file_closeup_edit.php?id="+id}));
			}
			if (!closeupPage) {
				container.append(jQ("<button class='btnCta1 theasis_btnCta1'>Close-up</button>").click(function(){location.href="/stock-photo-"+id+"-.php"}));
			}
		}
	};
	
	doStyle();
	doButtons();
}

// load jQuery and kick off the meat of the code when jQuery has finished loading
function addJQuery(callback) {
	window.jQ=jQuery.noConflict(true);
	main(); 
}

addJQuery(main);

