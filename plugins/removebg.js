const {Module} = require('../main');
const {MODE,RBG_KEY} = require('../config');
const w = MODE == 'public' ? false : true
const fs = require('fs');
const got = require('got');
const FormData = require('form-data');
const stream = require('stream');
const {promisify} = require('util');
const pipeline = promisify(stream.pipeline);
const {removeBgv2, imageUpscaler, imageUpscalerV2} = require('./misc/editors');
Module({pattern: 'removebg ?(.*)', fromMe: w,use: 'AI', desc: "Removes image background using AI"}, (async (message, match) => {    
if (!message.reply_message?.image) return await message.send("_Reply to a photo_");
let removing = await message.sendReply('_Removing background.._')
if (!RBG_KEY) {
    await message.client.sendMessage(message.jid,{image:await removeBgv2(await message.reply_message.download('buffer')),caption:'_Use doc command to convert this image to a document_'},{quoted:message.quoted})
    await message.edit('_Task complete!_',message.jid,removing.key)
}
    try {
        var location = await message.reply_message.download();
        var form = new FormData();
        form.append('image_file', fs.createReadStream(location));
        form.append('size', 'auto');
        var rbg = await got.stream.post('https://api.remove.bg/v1.0/removebg', {
            body: form,
            headers: {'X-Api-Key': RBG_KEY}
        }); 
        await pipeline(
		    rbg,
		    fs.createWriteStream('rbg.png')
        );
        await message.sendReply(fs.readFileSync('rbg.png'),'image'); 
        await message.edit('_Task complete!_',message.jid,removing.key)   
    } catch {
        await message.client.sendMessage(message.jid,{image:await removeBgv2(await message.reply_message.download('buffer')),caption:'_Use doc command to convert this image to a document_'},{quoted:message.quoted})
        await message.edit('_Task complete!_',message.jid,removing.key)
    }
    }));
Module({pattern: 'upscale ?(.*)', fromMe: w,use: 'AI', desc: "Enhances/upscales image quality using AI"}, (async (message, match) => {    
if (!message.reply_message?.image) return await message.send("_Reply to a photo_");
if (!match[1] || (match[1] != "1" && match[1] != "2")) return await message.sendReply("_Need type (1 or 2)_\n_Ex: .upscale 2_\n_(Note: 1 & 2 use different enhancing engines)_")
let removing = await message.sendReply('_Upscaling image.._') 
let image;
if (match[1] == "1"){
    image = await imageUpscaler(await message.reply_message.download('buffer'))
    } else {
    image = await imageUpscalerV2(await message.reply_message.download())
}   
if (!image) return await message.sendReply(`_Engine ${match[1]} error, please use ${match[1] =="1"?"2":"1"}_`)
await message.client.sendMessage(message.jid,{image,caption:"_Enhanced image_"},{quoted:message.quoted})
await message.edit('_Task complete!_',message.jid,removing.key)
}));
