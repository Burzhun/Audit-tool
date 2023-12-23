import path from 'path';
import fs from "fs";


const screenshotsPath = path.resolve(__dirname, './reports');

jasmine.getEnv().addReporter({
    specStarted: result => jasmine.currentTest = result,
    specDone: async (result) => {
        if (result.status === 'failed') {
            const image = await driver.takeScreenshot()
            try {
                await fs.promises.writeFile(`${screenshotsPath}/${expect.getState().currentTestName}.png`, image, 'base64');

            } catch (e) {
                console.log(e);
            }
        }
    }
});

// jasmine.getEnv().addReporter(new VideoReporter({
//     baseDirectory: screenshotsPath,
//     createSubtitles: true,
//     singleVideo: true,
//     ffmpegCmd: path.normalize('./node_modules/ffmpeg-binaries/bin/ffmpeg.exe'),
//     // ffmpegCmd: path.normalize('/usr/local/bin/ffmpeg'),
//     ffmpegArgs: [
//         '-f', 'avfoundation',
//         '-i', '1',
//         '-pix_fmt', 'yuv420p',
//         '-r', '24',
//         '-video_size', 'woxga',
//         '-q:v', '10',
//     ]
// }));
