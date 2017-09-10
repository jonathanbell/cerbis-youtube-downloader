const fs = require('fs');
const exec = require('child_process').exec;
const youtubedl = require('youtube-dl');
const ffmpeg = require('ffmpeg-static'); // ffmpeg.path
const findRemoveSync = require('find-remove');

const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const mustacheExpress = require('mustache-express');
app.engine('mustache', mustacheExpress());
app.set('view engine', 'mustache');
app.set('views', __dirname + '/views');

app.use(express.static('static'));
app.use(bodyParser.json()); // Support json encoded bodies.
app.use(bodyParser.urlencoded({ extended: true })); // Support encoded bodies.

let PORT = process.env.PORT || 3013;

function getVideo(url) {

  // First, check if an old file exists that needs to be deleted.
  fs.unlink('./music/tmpvideo.mp4', function(err) {
    if (err && err.code == 'ENOENT') {
      // File doens't exist.
      console.log('An old temporary video file didn\'t exist, so no need to remove it.');
    } else if (err) {
      throw err;
    } else {
      console.log('Old temporary video file removed.');
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
    video.pipe(fs.createWriteStream('./music/tmpvideo.mp4'));

    video.on('end', function() {
      console.log('Temporary video file (tmpvideo.mp4) sucessfully downloaded. Starting conversion to audio...');
      resolve(fileName);
    });

  });

}

app.get('/', function(req, res) {

  // Delete any existing .mp3 files inside the music folder.
  findRemoveSync('./music', { extensions: ['.mp3'] });

  res.render('homepage', {
    head: {
      title: 'Cerbi\'s YouTube Downloader'
    },
    body: {
      heading: 'Cerbi\'s YouTube Downloader',
      description: 'Made by Buck!'
    }
  });

});

app.post('/getvideo', function(req, res) {

  if (req.body.videoURL == undefined) {
    res.status(404).send('No YouTube video URL sent.').end();
    return;
  }

  if (req.body.videoURL != undefined || req.body.videoURL != '') {
    var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\?v=)([^#\&\?]*).*/;
    var match = req.body.videoURL.match(regExp);
    if (match && match[2].length == 11) {

      getVideo(req.body.videoURL).then(function(fileName) {

        // Got the mp4 file via our first promise. Now, convert it to mp3.
        exec(ffmpeg.path + ' -i ' + __dirname + '/music/tmpvideo.mp4 -vn -acodec libmp3lame -ac 2 -ab 160k -ar 48000 "' + __dirname + '/music/' + fileName + '.mp3"', (error, stdout, stderr) => {

          if (error) {
            console.error(`ffmpeg error: ${error}`);
            throw error;
          }

          // console.log(`stdout: ${stdout}`);
          // console.log(`stderr: ${stderr}`); // This is the printed output from ffmpeg.

          // We have made an mp3 from our mp4 so we can delete the video file.
          fs.unlink('./music/tmpvideo.mp4', function(err) {
            if (err) {
              console.log(err);
              throw err;
            }
          });

          console.log('All downloading and conversion tasks complete. File is available for download.');

          // Return the HTML link for download.
          res.send('<div class="download">Got it, Fawn! Download: <a class="download button" href="/music/' + fileName + '.mp3">' + fileName + '.mp3</a></div>');

        });

      }, function(error) {
        // Our promise was rejected :(
        res.status(500).send('Failed to get the YouTube video from the Interweb :( ', error);
      });

    } else {
      res.status(404).send('That\'s not a valid YouTube URL, fawn. Go back and try again. B').end();
    }
  } else {
    res.status(404).send('No YouTube video URL sent.').end();
  }

}); // app.post()

// Make mp3's download!
app.get('/music/:filename', function (req, res) {
  res.download(__dirname + '/music/' + req.params.filename);
});

app.listen(PORT, function() {
  console.log('Express listening on port ' + PORT + '.');
});
