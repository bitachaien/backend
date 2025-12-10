const axios = require("axios");
const qs = require('qs');
const { ApiConfigModel } = require("@Models/GameApi/ApiConfig");
const { ApiProductConfigModel } = require("@Models/GameApi/ApiProductConfig");
const { ApiGameConfigModel } = require("@Models/GameApi/ApiGameConfig");
const { urlencoded } = require("body-parser");


module.exports = async () => {
    const getAllGame = await ApiGameConfigModel.findAll();
    let i = 0;
    let success = 0;
    for (const game of getAllGame) {
        i++;
        try {

            let config = {
                method: 'get',
                maxBodyLength: Infinity,
                url: `http://103.77.215.81/upload_url.php?url=${encodeURIComponent(game.game_icon)}&folder=images&submit=Upload`,
                headers: { 
                  'content-type': 'application/x-www-form-urlencoded', 
                  'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
                }
              };
              
            const request = await axios.request(config);
            if (request) {
                if (request.data) {
                    const data = request.data;
                    if (data.status) {
                        const fileUrl = data.data.file_url;
                        if (fileUrl) {
                            game.game_icon = fileUrl;
                            await game.save();
                            success++;
                        }
                    }
                }
            }
            console.log("Images Imported: " + game.game_name);
        }catch(e) {
            console.log(e);
        }     
    }
    console.log("Images Success!!! " + success);
}