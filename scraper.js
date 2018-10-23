const Nick = require("nickjs")
const nick = new Nick()

async function getEnd(tab){
	const scraper = (arg, done) => {
		done(null, $(arg.link).attr("aria-label"))
	}

	const arg = {link: ".pagination-number"}
	
	const res = await tab.evaluate(scraper, arg)
	s = res.split("of")
	end = s[1]
	return end
}

async function getCategory(tab){
	await tab.untilVisible(".subzone-content")
	res_category = await tab.evaluate((arg, callback) => {
		const data = []
		$(".sub-cat-container").each((index, element) => {
			key = $(element).find(".left >.grey-text").text()
			val = $(element).find("a.zred").attr("href")
			data.push({
				category: key,
				link: val
			})
		})
		callback(null, data)
	})
	return res_category
}

async function getCuisines(tab){
	const scraper = (arg, done) => {
		data = []
		$(arg.link).each((index, element) => {
			data.push($(element).text())
		})
		done(null, data)
	}

	const arg = {link: "div.res-info-cuisines > a.zred"}
	const cuisines = await tab.evaluate(scraper, arg)
	return cuisines
}

async function getType(tab){
	const scraper = (arg, done) => {
		data = []
		$(arg.link).each((index, element) => {
			data.push($(element).text())
		})
		done(null, data)
	}

	const arg = {link: "div.res-header-overlay > div.row > div.col-l-12 > div.mb5 >  span.res-info-estabs > a.grey-text"}

	const type = await tab.evaluate(scraper, arg)
	return type

}

async function saveJson(res_link, cuisines, type, link_photos, folder_name){
	fs = require("fs")
	data = [{
		res_link: res_link,
		cuisines: cuisines,
		type: type,
		link_photos: link_photos
	}]
	read_file = []
	if (fs.existsSync(folder_name)){
		rw = fs.readFileSync(folder_name)
		read_file = JSON.parse(rw)
	}
	read_file = read_file.concat(data)
	fs.writeFileSync(folder_name, JSON.stringify(read_file))
}

async function getPlace(tab){
	const scraper = (arg, done) => {
		data = []
		$(arg.link).each((index, element) => {
			data.push($(element).attr("href"))		
		})
		done(null, data)	
	}

	const arg = {link: "section.wrapper,.mtop2,.ptop> div.ui,.segment,.row > a.col-l-1by3,.col-s-8,.pbot0"}
	const place = await tab.evaluate(scraper, arg)
	filter_place = place.filter((el) => {
		return el != null;
	})
	return filter_place
}

async function readLinkFile(){
	fs = await require("fs")
	raw_file = await fs.readFileSync("link.json")
	read_file = await JSON.parse(raw_file)
	return read_file
}

;(async () => {
	
	const tab = await nick.newTab()
	folder_name = "kelapa-gading-restaurants"
	restaurant_link = await readLinkFile()
	for(k = 0; k < restaurant_link.length; k++){
		console.log(k+"/"+restaurant_link.length)
		res_link = restaurant_link[k]
		await tab.open(res_link)
		await tab.untilVisible("div.res-info-cuisines" )
		await tab.inject("https://code.jquery.com/jquery-3.2.1.min.js")
		
		et = await getType(tab)
		cuisines = await getCuisines(tab)
		console.log(et)
		console.log(cuisines)
	
		res_link_photo = res_link + "/photos?category=food"
		const selector_click = "div#photoviewer_container > div.photoviewer_dimmer > div.photoModal > div.photosContainer > div.rightNavigation"
		await tab.open(res_link_photo)
		try{
			await tab.untilVisible(".photos_container_load_more")
			await tab.inject("https://code.jquery.com/jquery-3.2.1.min.js")
		}
		catch(err){continue;}
		
		const scraper_number = (arg, done) => {
			done(null, $(arg.link).text())
		}
		arg = {link: "div.photos_container_load_more > div.picLoadMore > div.cursor-pointer > span.grey-text"}
	
		//extract raw material to photo size number
		raw = await tab.evaluate(scraper_number, arg)
		s = raw.replace(/(\r\n\t|\n|\r\t)/gm,"").trim()
		sp = await s.split(" ")
		spn = await sp[0].replace("(+", "")
		pn = await parseInt(spn)
		try{
			await tab.click("div.photos_container_load_more > div.photobox > a > img.res-photo-thumbnail")
			//await tab.wait(5000)
			//await tab.click(selector_click)
		}catch(err){
			console.log("an error occured:", err)
		}
		await tab.wait(5000)
		
		const scraper = (arg, done) => {
			done (null, $(arg.link).attr("style"))		
		}
	
		arg = {link: "div#photoviewer_container > div.photoviewer_dimmer > div.photoModal > div.photosContainer > div.heroImage"}
	
		link_photos = []
		console.log(pn)
		if (Number.isNaN(pn)) pn = 30
		else pn += 30
		for (x=0; x < pn; x++){	
			res = await tab.evaluate(scraper, arg)
			s = res + ""
			link = s.substring(23, s.length-3)
			link_ori_photo = link.split("?")[0]
			await console.log(x+"/"+pn, link_ori_photo)
			await link_photos.push(link_ori_photo)
			await tab.click(selector_click)
			await tab.wait(500)
		}
		console.log("json")
		//saveJson(res_link, cuisines, type, link_photos)
		await saveJson(res_link, cuisines, et, link_photos, "json/"+folder_name+".json")
	
	
	
	//loop_k_end
	}
	
})().then(() => {nick.exit()})
