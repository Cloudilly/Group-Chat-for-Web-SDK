var Cloudilly= function() { };

Cloudilly.prototype.initialize= function(app, access, callback) {
	this.app= app;
	this.access= access;
	this.socket= {};
	this.tasks= {};
	this.callbacks= {};
	this.ping= {};
	this.pong= {};
	this.attempts= 0;
	this.username= "";
	this.password= "";
	callback();
	return;
}

Cloudilly.prototype.connect= function(username, password) {
	var self= this;
	if(self.socket && (self.socket.readyState== 0 || self.socket.readyState== 1)) { return; }
	self.username= username;
	self.password= password;
	self.reachability.call(self);
	self.socket= new WebSocket("wss://ws.cloudilly.com");
	self.socket.onopen= function() { self.attempts= 0; self.getCookie.call(self, "token") ? self.connectToken.call(self) : self.connectNormal.call(self); return; }
	
	self.socket.onmessage= function(msg) {
		if(msg.data== "1") { self.stopPong.call(self); return; }
		var obj= JSON.parse(msg.data);
		
		switch(obj.type) {
			case "reinit": self.connectNormal.call(self); return; 
			case "challenge": self.challenge.call(self, obj); return;
			
			case "connect":
				switch(obj.status) {
					case "success": self.connectSuccess.call(self, obj); return;
					case "fail": self.connectFail.call(self, obj); return;
				}
				return;
			
			case "task":
				switch(obj.status) {
					case "success": self.taskSuccess.call(self, obj); return;
					case "fail": self.taskFail.call(self, obj); return;
				}
				return;
			
			case "device": self.callbacks["device"].call(self, obj); return;
			case "post": self.callbacks["post"].call(self, obj); return;
		}
	}

	self.socket.onclose= function(err) {
		self.attempts= self.attempts+ 1;
		clearTimeout(self.ping);
		self.callbacks["disconnected"].call(self);
		if(err.code== 4000 || self.attempts> 100) { self.attempts= 0; return; }
		setTimeout(function() { self.connect.call(self, self.username, self.password); }, 2000 * self.attempts);
		return;
	}
}

// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// SAAS METHODS
// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

Cloudilly.prototype.disconnect= function() {
	var self= this;
	var obj= {};
	obj.type= "disconnect";
	var str= JSON.stringify(obj);
	self.socket.send(str);
},

Cloudilly.prototype.listen= function(group, callback) {
	var self= this;
	var obj= {};
	obj.type= "listen";
	obj.group= group;
	self.writeAndTask.call(self, obj, callback);
}

Cloudilly.prototype.listenWithPassword= function(group, password, callback) {
	var self= this;
	var obj= {};
	obj.type= "listen";
	obj.group= group;
	obj.password= password;
	self.writeAndTask.call(self, obj, callback);
}

Cloudilly.prototype.unlisten= function(group, callback) {
	var self= this;
	var obj= {};
	obj.type= "unlisten";
	obj.group= group;
	self.writeAndTask.call(self, obj, callback);
}

Cloudilly.prototype.join= function(group, callback) {
	var self= this;
	var obj= {};
	obj.type= "join";
	obj.group= group;
	self.writeAndTask.call(self, obj, callback);
}

Cloudilly.prototype.joinWithPassword= function(group, password, callback) {
	var self= this;
	var obj= {};
	obj.type= "join";
	obj.group= group;
	obj.password= password;
	self.writeAndTask.call(self, obj, callback);
}

Cloudilly.prototype.unjoin= function(group, callback) {
	var self= this;
	var obj= {};
	obj.type= "unjoin";
	obj.group= group;
	self.writeAndTask.call(self, obj, callback);
}

Cloudilly.prototype.update= function(payload, callback) {
	var self= this;
	var obj= {};
	obj.type= "update";
	obj.payload= payload;
	self.writeAndTask.call(self, obj, callback);
}

Cloudilly.prototype.post= function(group, payload, callback) {
	var self= this;
	var obj= {};
	obj.type= "post";
	obj.group= group;
	obj.payload= payload;
	self.writeAndTask.call(self, obj, callback);
}

Cloudilly.prototype.login= function(username, password, callback) {
	var self= this;
	self.username= username;
	self.password= password;
	var obj= {};
	obj.type= "login";
	obj.username= self.username;
	obj.password= self.password;
	self.writeAndTask.call(self, obj, callback);
}

Cloudilly.prototype.logout= function(callback) {
	var self= this;
	delete self.username;
	delete self.password;
	var obj= {};
	obj.type= "logout";
	self.writeAndTask.call(self, obj, callback);
}

Cloudilly.prototype.changePassword= function(group, password, token, callback) {
	var self= this;
	var obj= {};
	obj.type= "changePassword";
	obj.group= group;
	obj.password= password;
	obj.token= token;
	self.writeAndTask.call(self, obj, callback);
}

// @@@@@@@@@@@@@@@@@@@@@@@@@@@
// HELPER METHODS
// @@@@@@@@@@@@@@@@@@@@@@@@@@@

Cloudilly.prototype.challenge= function(obj) {
	var self= this;
	self.getToken.call(self, obj.device, function(res) {
		self.setCookie.call(self, "token", res, function() {
			self.connectToken.call(self);
		});
	});
}
Cloudilly.prototype.connectNormal= function() {
	var self= this; if(!self.socket || self.socket.readyState!= 1) { return; }
	var obj= {}; obj.type= "connect"; obj.app= self.app; obj.access= self.access; obj.saas= "web"; obj.version= 1;
	if(self.username) { obj.username= self.username; }; if(self.password) { obj.password= self.password; }
	var str= JSON.stringify(obj); self.socket.send(str);
}
Cloudilly.prototype.connectToken= function() {
	var self= this; if(!self.socket || self.socket.readyState!= 1) { return; }
	var obj= {}; obj.type= "auth"; obj.app= self.app; obj.token= self.getCookie.call(self, "token"); var str= JSON.stringify(obj); self.socket.send(str);
}
Cloudilly.prototype.connectSuccess= function(obj) { var self= this; self.startPing.call(self); self.callbacks["connected"].call(self, null, obj); }
Cloudilly.prototype.connectFail= function(obj) { var self= this; self.clearCookie.call(self, "token"); self.callbacks["connected"].call(self, 1, obj); }
Cloudilly.prototype.taskSuccess= function(obj) {
	var self= this;
	if(!self.callbacks[obj.task]) { return; }
	self.callbacks[obj.task].call(self, null, obj);
	delete self.callbacks[obj.task];
	delete self.tasks[obj.task];
}
Cloudilly.prototype.taskFail= function(obj) {
	var self= this;
	if(!self.callbacks[obj.task]) { return; }
	self.callbacks[obj.task].call(self, 1, obj);
	delete self.callbacks[obj.task];
	delete self.tasks[obj.task];
}
Cloudilly.prototype.startPing= function() { var self= this; self.firePing.call(self); self.ping= setInterval(function() { self.firePing.call(self); }, 15000); }
Cloudilly.prototype.firePing= function() {
	var self= this; if(!self.socket || self.socket.readyState!= 1) { return; }
	self.socket.send("1"); self.startPong.call(self);
	var tasks= []; for(var key in self.tasks) { tasks.push([key, self.tasks[key]["timestamp"]]); };
	tasks.sort(function(a, b) { return a[1]< b[1] ? 1 : a[1]> b[1] ? -1 : 0 });
	var length= tasks.length; while(length--) { var task= self.tasks[tasks[length][0]]; self.socket.send(task.data); }
}
Cloudilly.prototype.startPong= function() {
	var self= this;
	if(self.pong) { clearTimeout(self.pong); self.pong= null; }
	self.pong= setTimeout(function() { self.firePong.call(self); }, 5000);
}
Cloudilly.prototype.stopPong= function() {
	var self= this;
	if(!self.pong) { return; }
	clearTimeout(self.pong);
	self.pong= null;
}
Cloudilly.prototype.firePong= function() {
	self.socket.close();
}
Cloudilly.prototype.writeAndTask= function(obj, callback) {
	var self= this; if(!self.socket || self.socket.readyState!= 1) { return; }
	var timestamp= Math.round(new Date().getTime()); var tid= obj.type + "-" + self.generateUUID.call();
	obj.task= tid; self.callbacks[tid]= callback;
	var task= {}; task.timestamp= timestamp; task.data= JSON.stringify(obj); task.task= tid; self.tasks[tid]= task;
	var str= JSON.stringify(obj); self.socket.send(str);
}
Cloudilly.prototype.reachability= function() {
	var self= this; window.addEventListener("online", function(e) { self.connect.call(self, self.username, self.password); });
}
Cloudilly.prototype.generateUUID= function() {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) { var r= Math.random()*16|0; var v= c=== "x" ? r : (r&0x3|0x8); return v.toString(16); });
}

// @@@@@@@@@@@@@@@@@@@@@@@@@@@
// DELEGATE METHODS
// @@@@@@@@@@@@@@@@@@@@@@@@@@@

Cloudilly.prototype.socketConnected= function(callback) { this.callbacks["connected"]= callback; }
Cloudilly.prototype.socketDisconnected= function(callback) { this.callbacks["disconnected"]= callback; }
Cloudilly.prototype.socketReceivedDevice= function(callback) { this.callbacks["device"]= callback; }
Cloudilly.prototype.socketReceivedPost= function(callback) { this.callbacks["post"]= callback; }

// @@@@@@@@@@@@@@@@@@@@@@@@@@@
// COOKIES
// @@@@@@@@@@@@@@@@@@@@@@@@@@@

Cloudilly.prototype.setCookie= function(cname, cvalue, callback) {
	var d= new Date(Date.now() + 86400000); var expires= "expires=" + d.toUTCString(); var path= "path=/";
	document.cookie= cname + "=" + cvalue + "; " + expires + ";" + path + ";"; callback(); return;
}
Cloudilly.prototype.clearCookie= function(cname) { document.cookie= cname + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC"; return; }
Cloudilly.prototype.getCookie= function(cname) {
	var name= cname+ "="; var ca= document.cookie.split(";");
	for(var i= 0; i< ca.length; i++) { var c= ca[i]; while(c.charAt(0)==" ") { c= c.substring(1); }; if(c.indexOf(name)== 0) { return c.substring(name.length, c.length); } }
}
Cloudilly.prototype.getToken= function(device, callback) {
	var self= this; var xmlHttp= new XMLHttpRequest(); xmlHttp.open("POST", "/tokens", true); xmlHttp.setRequestHeader("content-type","application/x-www-form-urlencoded");
	xmlHttp.onreadystatechange= function() { if(xmlHttp.readyState== 4 && xmlHttp.status== 200) { callback(xmlHttp.responseText); } }
	xmlHttp.send("device=" + device);
}