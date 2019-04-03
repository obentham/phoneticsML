var Session = /** @class */ (function () {
	function Session() {
		var _this = this;
		var btn = document.getElementById("sheet_url_button");
		btn.addEventListener("click", function (e) { return _this.run(); });
	}
	Session.prototype.run = function () {
		var url = document.getElementById("sheet_url").value;
		
		console.log(url)
		
		// AT THIS POINT YOU HAVE THE VIEW WITH THE URL
		
		/*if (!/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/.test(url)) {
			document.getElementById("predictions").innerHTML = "Invalid URL";
		}
		else {
			var spreadsheetId = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)[1];
			if (!/gid=([0-9]+)/.test(url)) {
				document.getElementById("predictions").innerHTML = "Use the url from the address bar, not from the share window in google sheets. It needs to have gid=# at the end";
			}
			else {
				var sheetId = url.match(/gid=([0-9]+)/)[1];
				//document.getElementById("predictions").innerHTML = "spreadsheetID: " + spreadsheetId + " . . . . . sheetID: " + sheetId;
			}
		}*/
	};
	return Session;
}());
// start the app
new Session();
