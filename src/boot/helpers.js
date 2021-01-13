import { relayPool } from "nostr-tools";

let deferredPrompt;
require("md-gum-polyfill");
var crypto = require("crypto");
var bitcoin = require("bitcoinjs-lib");
const bip39 = require("bip39");
const bip32 = require("bip32");
const bs58 = require("bs58");
var wif = require("wif");
const Buffer = require("safe-buffer").Buffer;

const identicon = require("identicon");
const convert = schnorr.convert;
import shajs from "sha.js";
import BigInteger from "bigi";
import schnorr from "bip-schnorr";
import { copyToClipboard } from "quasar";
const ecurve = require("ecurve");
const curve = ecurve.getCurveByName("secp256k1");
const G = curve.G;

export const myHelpers = {
	data() {
		return {
			profile: {
				pubkey: null,
				privkey: null,
				avatar: null,
				about: null,
				handle: null,
				follows: [],
			},
			following: [],
			passphrasegenerated: false,
			step: 1,
			disabled: false,
			link: "inbox",
			publishtext: "",
			search: "",
			selectedTab: "myAccount",
			splitterModel: 20,
			dialogpublish: false,
			dialoggenerate: false,
			activatevideo: false,
			imageCaptured: false,
			showInstallBanner: false,
			user: {
				isPwd: true,
				passphrase: "",
				keystoreoption: "local",
				loading: false,
			},
			publishtext: "",
			emojiOn: false,
			activatevideohome: false,
			imageCaptured: false,
			hasCamerasuport: true,
			homeembedimage: false,
			imagefile: "",
			newpost: {
				user: "",
				message: "",
				image: null,
				date: Date.now(),
			},
			emojis1: [
				{ item: "😂" },
				{ item: "😃" },
				{ item: "😍" },
				{ item: "😘" },
				{ item: "😭" },
				{ item: "🤣" },
				{ item: "🧐" },
				{ item: "👊" },
				{ item: "🤘" },
			],
			emojis2: [
				{ item: "👌" },
				{ item: "🙌" },
				{ item: "🤦" },
				{ item: "🚀" },
				{ item: "🔥" },
				{ item: "💯" },
				{ item: "⚡" },
				{ item: "🏴󠁧󠁢󠁷󠁬󠁳󠁿" },
				{ item: "🌑" },
			],
			posts: [],
			followlist: false,
		};
	},
	methods: {
		async sendPost(message, tags) {
			const pool = relayPool();

			pool.setPrivateKey(this.$q.localStorage.getItem("privkey")); // optional

			var relays = JSON.parse(this.$q.localStorage.getItem("relays"));
			for (var i = 0; i < relays.length; i++) {
				pool.addRelay(relays[i], {
					read: true,
					write: true,
				});
			}

			pool.onEvent((event, context, relay) => {
				if (this.$q.localStorage.getItem(event.id) === null) {
					var postss = JSON.parse(
						this.$q.localStorage.getItem("posts")
					);
					this.$q.localStorage.set(event.id, JSON.stringify(event));
					postss.unshift(event.id);
					this.$q.localStorage.set("posts", JSON.stringify(postss));
					this.posts.unshift({
						id: event.id,
						message: event.content,
						avatar: this.avatarMake(event.pubkey),
						date: event.created_at * 1000,
						user: event.pubkey,
						tags: event.tags,
						handle: null,
					}); // what to push unto the rows array?
				}
				this.publishtext = "";
			});
			console.log(tags);
			const timest = Math.floor(Date.now() / 1000);
			var eventObject = {
				pubkey: String(this.$q.localStorage.getItem("pubkey")),
				created_at: timest,
				kind: 1,
				tags: [
					"dm",
					"f9e10c85f4baf021b88b4d19534ac25b81a5ca2a1fc99c8fe2e3bb40e85f9d10",
					"wss://nostr-relay.bigsun.xyz",
				],
				content: message,
			};

			pool.subKey(String(this.$q.localStorage.getItem("pubkey")));

			pool.publish(eventObject);
		},
		avatarMake(theData) {
			// Synchronous API

			const avicon = shajs("sha256")
				.update(theData)
				.digest("hex");
			console.log(avicon);
			return identicon.generateSync({ id: avicon, size: 40 });
		},
		addPubFollow(pubKeyFollow) {
			console.log(pubKeyFollow);
			if (!this.$q.localStorage.getItem("follow")) {
				this.$q.localStorage.set(
					"follow",
					JSON.stringify([this.$q.localStorage.getItem("pubkey")])
				);
			}
			var follows = JSON.parse(this.$q.localStorage.getItem("follow"));
			console.log(follows.includes("pubKeyFollow"));
			if (!follows.includes(pubKeyFollow)) {
				follows.push(pubKeyFollow);

				this.$q.localStorage.set("follow", JSON.stringify(follows));
				this.$q.localStorage.set(
					pubKeyFollow,
					JSON.stringify({
						handle: pubKeyFollow,
						about: "",
						avatar: "",
					})
				);
			} else {
				this.$q.notify({
					message: "Already following",
					color: "secondary",
				});
			}

			this.getAllPosts();
		},
		getAllPosts() {
			this.getRelayPosts();
			var postss = JSON.parse(this.$q.localStorage.getItem("posts"));

			for (var i = 0; i < postss.length; i++) {
				var singlePost = JSON.parse(
					this.$q.localStorage.getItem(postss[i])
				);

				if (singlePost.kind == 1) {
					this.posts.push({
						id: singlePost.id,
						message: singlePost.content,
						avatar: this.avatarMake(singlePost.pubkey),
						date: singlePost.created_at * 1000,
						user: singlePost.pubkey,
						tags: singlePost.tags,
						handle: null,
					});
				}
			}
		},

		getRelayPosts() {
			const pool = relayPool();

			var relays = JSON.parse(this.$q.localStorage.getItem("relays"));
			for (var i = 0; i < relays.length; i++) {
				pool.addRelay(relays[i], {
					read: true,
					write: true,
				});
			}
			pool.onEvent((event, context, relay) => {
				if (this.$q.localStorage.getItem(event.id) === null) {
					var postss = JSON.parse(
						this.$q.localStorage.getItem("posts")
					);
					this.$q.localStorage.set(event.id, JSON.stringify(event));
					postss.unshift(event.id);
					this.$q.localStorage.set("posts", JSON.stringify(postss));
					this.posts.unshift({
						id: event.id,
						message: event.content,
						avatar: this.avatarMake(event.pubkey),
						date: event.created_at * 1000,
						user: event.pubkey,
						tags: event.tags,
						handle: null,
					}); // what to push unto the rows array?
				}
				this.publishtext = "";
			});
			var follows = JSON.parse(this.$q.localStorage.getItem("follow"));
			for (var i = 0; i < follows.length; i++) {
				pool.subKey(follows[i]);
			}
			pool.reqFeed();
		},

		captureimage() {
			let video = this.$refs.video;
			let canvas = this.$refs.canvas;
			canvas.width = video.getBoundingClientRect().width;
			canvas.height = video.getBoundingClientRect().height;
			let context = canvas.getContext("2d");
			context.drawImage(video, 0, 0, canvas.width, canvas.height);
			this.imageCaptured = true;
			this.newpost.imagetemp = canvas.toDataURL();
			this.newpost.image = this.dataURItoBlob(canvas.toDataURL());
			const vid = document.querySelector("video");
			const mediaStream = vid.srcObject;
			const tracks = mediaStream.getTracks();
			tracks.forEach((track) => track.stop());
		},
		captureimageupload(file) {
			console.log(this.imagefile);
			this.newpost.image = file;

			let canvas = this.$refs.canvas;
			let context = canvas.getContext("2d");

			var reader = new FileReader();
			reader.onload = (event) => {
				var img = new Image();
				img.onload = () => {
					canvas.width = 240 * (img.width / img.height);
					canvas.height = 240;

					context.drawImage(img, 0, 0, canvas.width, canvas.height);
					this.imageCaptured = true;
					this.homeembedimage = true;
					this.newpost.imagetemp = canvas.toDataURL();
					console.log(this.newpost.imagetemp);
				};
				img.src = event.target.result;
			};
			reader.readAsDataURL(file);
		},
		dataURItoBlob(dataURI) {
			var byteString = atob(dataURI.split(",")[1]);
			var mimeString = dataURI
				.split(",")[0]
				.split(":")[1]
				.split(";")[0];

			var ab = new ArrayBuffer(byteString.length);

			var ia = new Uint8Array(ab);

			for (var i = 0; i < byteString.length; i++) {
				ia[i] = byteString.charCodeAt(i);
			}

			// write the ArrayBuffer to a blob, and you're done
			var blob = new Blob([ab], { type: mimeString });
			return blob;
		},

		VideoonSubmit() {},
		getFile() {
			this.$refs.myFileInput.$el.click();
		},
		initcamerahome() {
			this.activatevideohome = true;
			navigator.mediaDevices
				.getUserMedia({
					video: true,
				})
				.then((stream) => {
					this.$refs.video.srcObject = stream;
				})
				.catch((error) => {
					activatevideohome = false;
					this.$q.notify({
						message: "No camera found :(",
						color: "secondary",
					});
				});
		},
		discamerahome() {
			this.activatevideohome = false;
			this.homeembedimage = false;
			this.newpost.imagetemp = "";
			this.newpost.image = "";
			this.imageCaptured = false;
		},
		photoverify() {
			this.homeembedimage = true;
			this.activatevideohome = false;
		},

		////////////////////////////////////
		//////////start nostr helpers///////
		////////////////////////////////////
		PublishonSubmit() {},

		finalgenerate() {
			var stored = this.user.keystoreoption;

			if (stored == "external") {
				this.$q.localStorage.set("exernal", true);
				this.$q.localStorage.set("pubkey", this.user.publickey);
				this.$router.push("/");
				this.disabled = false;
				this.link = "home";
			} else if (stored == "url") {
				this.$router.push(
					"/" +
						"?pub=" +
						this.user.publickey +
						"&prv=" +
						this.user.privatekey
				);
				this.disabled = false;
				this.link = "home";
			} else {
				this.$q.localStorage.set("privkey", this.user.privatekey);
				this.$q.localStorage.set("pubkey", this.user.publickey);
				this.$q.localStorage.set("mnemonic", this.user.passphrase);
				this.$q.localStorage.set(
					"relays",
					JSON.stringify(["wss://nostr-relay.bigsun.xyz"])
				);
				this.$q.localStorage.set("posts", JSON.stringify([]));
				this.addPubFollow(this.user.publickey);

				this.$router.push("/");
				this.disabled = false;
				this.link = "home";
			}
		},
		createKeys() {
			var randomBytes = crypto.randomBytes(16);
			var mnemonic = bip39.entropyToMnemonic(randomBytes.toString("hex"));

			this.user.passphrase = mnemonic;
			this.$q.notify({
				message: "MAKE SURE YOU BACKUP YOUR WORD LIST",
			});

			const seed = bip39.mnemonicToSeedSync(mnemonic);
			const root = bip32.fromSeed(seed);
			const path = "m/0'/0/0";
			const child1 = root.derivePath(path);
			this.passphrasegenerated = true;
			console.log(root.privateKey.toString("hex"));
			this.user.privatekey = root.privateKey.toString("hex");

			const privKey = BigInteger.fromHex(root.privateKey.toString("hex"));
			console.log(privKey);
			//  const pubkey = pointToBuffer(G.multiply(privKey)).toString('hex')
			const pubkey = G.multiply(privKey)
				.getEncoded(true)
				.slice(1)
				.toString("hex");
			this.user.publickey = pubkey;

			console.log(pubkey);
			//console.log(privKey.toString('hex'))
			const mess = "what a cunt".toString("hex");
			//  const message = pointToBuffer('243F6A8885A308D313198A2E03707344A4093822299F31D0082EFA98EC4E6C89', 'hex');
			//  const createdSignature = schnorr.sign(privKey, message);
			//  console.log('The signature is: ' + createdSignature.toString('hex'));

			//  console.log(privKey)

			// const message = Buffer.from(this.hexToBytes("Ooo, what a cunt".toString('hex')), 'hex');
			// const createdSignature = schnorr.sign(privKey, message);
			// console.log(createdSignature)
			// console.log('The signature is: ' + createdSignature.toString('hex'));
		},
		dialoguegenerate() {
			this.dialoggenerate = true;
			this.video = false;
		},
		dialoguestarted() {
			this.dialogpublish = true;
			this.video = false;
		},
	},
	filters: {
		//prefer handle over user
		handler(value, value2) {
			if (value != "") {
				return value;
			} else {
				return value2;
			}
		},
		//make timestamp look nice
		niceDate(value) {
			let formattedString = date.formatDate(value, "YYYY MMM D h:mm A");
			return formattedString;
		},
	},
};
