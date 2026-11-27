import * as fs from "fs";
export function saveGraph(path: string, jsonData: string) {
	fs.writeFile(path, jsonData, (err: NodeJS.ErrnoException | null) => {
		if (err) console.error(err);
	});
}
// var fs = require('fs');
// fs.writeFile("test.json", jsonData, function(err) {
//     if (err) {
//         console.log(err);
//     }
// });
