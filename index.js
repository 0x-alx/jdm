import { JSDOM } from "jsdom";
import nodemailer from "nodemailer";
import jdm from "./jdm.json" assert { type: "json" };
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
	host: "smtp.hostinger.com",
	port: 465,
	secure: true, // Use `true` for port 465, `false` for all other ports
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS,
	},
});

const fetchData = async () => {
	const res = await fetch(
		`https://journaldemonaco.gouv.mc/Journaux/${jdm[0].year}/Journal-${jdm[0].number}`
	);
	const text = await res.text();
	return text;
};

const filterData = (text) => {
	const dom = new JSDOM(text);
	const document = dom.window.document;
	const items = document.querySelectorAll("li.u-no-bullet a");
	const offers = Array.from(items)
		.filter((item) => item.textContent.includes("Avis de recrutement"))
		.map((item) => ({
			offer_name: item.textContent.trim(),
			link: item.href,
		}));
	return offers;
};

const createEmailBody = (data) => {
	return `
    <h3>JDM ${
		jdm[0].number
	} - Voici les nouveaux avis de recrutements publiés ce jour</h3>
    </br>
	<ul>
		${data
			.map(
				(item) =>
					`<li><a href="https://journaldemonaco.gouv.mc/${item.link}">${item.offer_name}</a></li>`
			)
			.join("")}
	</ul>
	`;
};

const sendEmail = (data) => {
	transporter.sendMail({
		from: "contact@alex-c.dev",
		to: "alx.charbo@gmail.com",
		subject: `Journal de Monaco ${jdm[0].number} - Avis de recrutement`,
		html: data,
	});
};

const main = async () => {
	const text = await fetchData();
	const data = filterData(text);
	const emailBody = createEmailBody(data);
	sendEmail(emailBody);
};

main()
	.then(async () => {
		const jdmData = await JSON.parse(fs.readFileSync("jdm.json", "utf8"));
		jdmData[0].number += 1;
		await fs.writeFileSync("jdm.json", JSON.stringify(jdmData, null, 2));
		console.log("Email sent successfully ! ✅");
	})
	.catch((error) => console.error("Une erreur s'est produite : ", error));
