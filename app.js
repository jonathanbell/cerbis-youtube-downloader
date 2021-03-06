const fs = require('fs');
const exec = require('child_process').exec;
const youtubedl = require('youtube-dl');
const ffmpeg = require('ffmpeg-static'); // ffmpeg.path
const findRemoveSync = require('find-remove');

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const ipfilter = require('express-ipfilter').IpFilter;
const IpDeniedError = require('express-ipfilter').IpDeniedError;

// Dis-allowed IPs. See `express-ipfilter` above.
var ips = ['142.34.74.1', ['160.254.1.1', '160.254.1.9']];

const mustacheExpress = require('mustache-express');
app.engine('mustache', mustacheExpress());
app.set('view engine', 'mustache');
app.set('views', __dirname + '/views');

app.use(express.static('static'));
app.use(bodyParser.json()); // Support json encoded bodies.
app.use(bodyParser.urlencoded({ extended: true })); // Support encoded bodies.

// Restrict IPs.
app.use(ipfilter(ips));
app.use(function(err, req, res, _next) {
  // console.error('IP Filter threw an error: ', err);
  if (err instanceof IpDeniedError) {
    res.status(401);
  }

  res.send(
    'Access is denyed to this app is denied from your location. Please email jonathanbell.ca@gmail.com for access.'
  );
});

let PORT = process.env.PORT || 3013;

var availableFile = false;

app.get('/', function(req, res) {
  // Delete any existing .mp3 files inside the music folder.
  findRemoveSync('./music', { extensions: ['.mp3'] });

  res.render('homepage', {
    head: {
      title: "Cerbi's YouTube Downloader"
    },
    body: {
      heading: "Cerbi's YouTube Downloader",
      description: 'Made by Buck!'
    }
  });
});

app.post('/getvideo', function(req, res) {
  availableFile = false;

  // First, check if an old file exists that needs to be deleted.
  fs.unlink('./music/tmpvideo.mp4', function(err) {
    if (err && err.code == 'ENOENT') {
      // File doens't exist.
      console.log(
        "An old temporary video file didn't exist, so no need to remove it."
      );
    } else if (err) {
      throw err;
    } else {
      console.log('Old temporary video file removed.');
    }
  });

  if (req.body.videoURL == undefined) {
    res
      .status(404)
      .send('No YouTube video URL sent.')
      .end();
    return;
  }

  if (req.body.videoURL != undefined || req.body.videoURL != '') {
    var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\?v=)([^#\&\?]*).*/;
    var match = req.body.videoURL.match(regExp);
    if (match && match[2].length == 11) {
      let video = youtubedl(req.body.videoURL, ['--format=18'], {
        cwd: __dirname
      });
      let fileName = '';

      // Will be called when the download starts.
      video.on('info', function(info) {
        console.log('Download started.');
        console.log('File name: ' + info._filename);
        console.log('File size: ' + info.size);

        fileName = info._filename.slice(0, -4);
        // Return the filename for download later.
        res.send(fileName);
      });

      // Error handler.
      video.on('error', function error(err) {
        console.log('Error downloading video: ', err);
      });

      // Make the request for the video to YouTube.
      video.pipe(fs.createWriteStream('./music/tmpvideo.mp4'));

      video.on('end', function() {
        console.log(
          'Temporary video file (tmpvideo.mp4) sucessfully downloaded. Starting conversion to audio...'
        );

        // Got the mp4 file. Now, convert it to mp3.
        exec(
          ffmpeg.path +
            ' -i ' +
            __dirname +
            '/music/tmpvideo.mp4 -vn -acodec libmp3lame -ac 2 -ab 160k -ar 48000 "' +
            __dirname +
            '/music/' +
            fileName +
            '.mp3"',
          (error, stdout, stderr) => {
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

            availableFile = true;
            console.log(
              'All downloading and conversion tasks complete. File is available for download.'
            );
          }
        ); // exec()
      });
    } else {
      res
        .status(404)
        .send("That's not a valid YouTube URL, fawn. Go back and try again. B")
        .end();
    }
  } else {
    res
      .status(404)
      .send('No YouTube video URL sent.')
      .end();
  }
}); // app.post('/getvideo')

// Make mp3's download!
app.get('/music/:filename', function(req, res) {
  if (availableFile) {
    res.download(__dirname + '/music/' + req.params.filename);
  } else {
    res.sendStatus(204);
  }
});

app.listen(PORT, function() {
  console.log('Express listening on port ' + PORT + '.');
});
