const fs = require('fs');
const exec = require('child_process').exec;

// https://www.npmjs.com/package/youtube-dl
const youtubedl = require('youtube-dl');

// https://www.npmjs.com/package/ffmpeg-static
const ffmpeg = require('ffmpeg-static'); // ffmpeg.path

function getVideo(url) {
  // First, check if an old file exists that needs to be deleted.
  fs.unlink('tmpvideo.mp4', function(err) {
    if (err && err.code == 'ENOENT') {
      // File doens't exist.
      console.log("tmpvideo.mp4 didn't exist, so no need to remove it.");
    } else if (err) {
      throw err;
    }
  });

  return new Promise(function(resolve, reject) {
    let video = youtubedl(url, ['--format=18'], { cwd: __dirname });
    let fileName = '';

    // Will be called when the download starts.
    video.on('info', function(info) {
      console.log('Download started.');
      console.log('Filename: ' + info._filename);
      console.log('Size: ' + info.size);

      fileName = info._filename.slice(0, -4);
    });

    // Error handler.
    video.on('error', function error(err) {
      console.log('Error downloading video: ', err);
      reject(err);
    });

    // Make the request.
    video.pipe(fs.createWriteStream('tmpvideo.mp4'));

    video.on('end', function() {
      console.log('tmpvideo.mp4 sucessfully downloaded.');
      resolve(fileName);
    });
  });
}

module.exports = function(url) {
  getVideo(url).then(
    function(fileName) {
      // Got the mp4. Now, convert it to mp3.
      exec(
        ffmpeg.path +
          ' -i tmpvideo.mp4 -vn -acodec libmp3lame -ac 2 -ab 160k -ar 48000 "' +
          fileName +
          '.mp3"',
        (error, stdout, stderr) => {
          if (error) {
            console.error(`ffmpeg error: ${error}`);
            return error;
          }

          // console.log(`stdout: ${stdout}`);
          // console.log(`stderr: ${stderr}`); // This is the printed output from ffmpeg.

          // We have made an mp3 from our mp4 so we can delete the video file.
          fs.unlink('tmpvideo.mp4', function(err) {
            if (err) throw err;
          });

          console.log('All downloading and conversion tasks complete.');
          return fileName;
        }
      );
    },
    function(error) {
      // Our promise was rejected :(
      console.error(
        'Failed to get the YouTube video from the Interweb :( ',
        error
      );
      return false;
    }
  );
};
