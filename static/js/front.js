$('#getAudio').submit(function(e) {
  e.preventDefault();

  if ($('#videoURL').val() != undefined || $('#videoURL').val() != '') {
    var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\?v=)([^#\&\?]*).*/;
    var match = $('#videoURL').val().match(regExp);
    if (match && match[2].length == 11) {

      // Valid YT URL.
      var formData = $(this).serialize();
      var msgTimeout1;
      var msgTimeout2;

      $.ajax({
        type: 'POST',
        url: '/getvideo',
        data: formData,
        beforeSend: function() {
          $('#working').css('opacity', '1');
          $('#working img').addClass('pulse').attr('src', '/img/fawn.jpg');
          $('p.msg').html("I'm working on it, Cerbs!");
          msgTimeout1 = setTimeout(function() {
            $('p.msg').html('Still working on it, fawn... Hold on! Almost done! <img style="height: auto; width: 22px;" src="/img/horse.png" />');
          }, 20000);
          msgTimeout2 = setTimeout(function() {
            $('p.msg').html("Oh man.. This is taking a LONG time. Sorry, I'll ask Buckley to hurry up! It's totally his fault..");
          }, 50000);
        },
        success: function(data) {
          clearTimeout(msgTimeout1);
          clearTimeout(msgTimeout2);
          $('#working img').removeClass('pulse').attr('src', '/img/dog.jpg');
          $('#videoURL').val('');
          $('p.msg').html("Success! CooOoOOol!!!");
          $('#results').append(data);
        },
        error: function(err) {
          clearTimeout(msgTimeout1);
          clearTimeout(msgTimeout2);
          $('#working').css('opacity', '0');
          $('#working img').removeClass('pulse');
          $('#videoURL').val('');
          $('p.msg').html("Oh no! Sad fawnz...");
          alert('Cerbs, I\'m really sorry, but something went wrong. Please let your buck know about this. :/');
          console.log(err);
        }
      });

    } else {
      alert('Buck says: "That\'s not a valid YouTube URL, fawn. Go back and try again!"');
      return false;
    }
  } else {
    alert('You gotta put a YouTube URL into the little box, fawn!');
    return false;
  }

});
