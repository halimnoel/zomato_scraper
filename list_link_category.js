const Nick = require("nickjs")
const fs = require("fs")
const nick = new Nick()

async function saveJson(fn, res_link){
	file_name = "link/"+fn
	read_file = []
	if(fs.existsSync(file_name)){
		r = fs.readFileSync(file_name)
		read_file = JSON.parse(r)
	}			
	read_file = read_file.concat(res_link)
	fs.writeFileSync(file_name, JSON.stringify(read_file))
}


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

;(async () =>{
	const tab = await nick.newTab()
	await tab.open("zomato.com")
	await tab.untilVisible(".start")
	await tab.inject("https://code.jquery.com/jquery-3.2.1.min.js")
	place = await getPlace(tab)

			link = "https://www.zomato.com/jakarta/kelapa-gading-restaurants?desserts-bakes=1&ref_page=subzone"
			sp = link.split("/")
			file_name = sp[sp.length - 1].split("=")[0]
			await tab.open(link)
			await tab.untilVisible(".result-title")
		
			await tab.inject("https://code.jquery.com/jquery-3.2.1.min.js")
			
			end = await getEnd(tab)
			restaurant_link = []
			console.log("category: "+ "Dine-out restaurants")
			for (j = 1; j <= end; j++){
					sublink = await link + "&page=" + j
					await tab.open(sublink)
					try{
						await tab.wait(10000)
						await tab.inject("https://code.jquery.com/jquery-3.2.1.min.js")
					}catch(err){
						saveJson(file_name ,restaurant_link);
						break;
					}
					eval = await tab.evaluate((arg, callback) => {
					const data = []
					$(".result-title").each((index, element) => {
						data.push($(element).attr("href"))
					})
					callback(null, data)
				})
				restaurant_link = await restaurant_link.concat(eval)
			}
			restaurant_link = Array.from(new Set(restaurant_link))	
			saveJson(file_name, restaurant_link)
})().then(() => {nick.exit()})		
