var usernameValidation = { equals: false };
var passwordValidation = { equals: false };

function checkValidation() {
    if (usernameValidation.equals === true && passwordValidation.equals === true) {
        $('#register-button').prop('disabled', false);
        $('#register-button').css({
            'background-color': '',
            'color': ''
        });
    } else {
        $('#register-button').prop('disabled', true);
    }
}

$(document).ready(function() {
    $('#username').on('input', function() { // USERNAME VALIDATION
        var username = $('#username').val();
        $.ajax({
            url: '/checkUsername',
            data: { username: username },
            success: function(data) {
                if (username.length == 0) {
                    $('#register-button').prop('disabled', true);
                    $('#usernameSpan').text('');
                    $('#username').css('background-color', '');
                    $('#register-button').css({
                        'background-color': '#ff7f6e',
                        'color': 'black'
                    });
                    usernameValidation.equals = false;
                } else if (/\s/.test(username)) {
                    // Username contains whitespace
                    $('#register-button').prop('disabled', true);
                    $('#register-button').css({
                        'background-color': '#ff7f6e',
                        'color': 'black'
                    });
                    $('#username').css('background-color', '#ffc0b8');
                    $('#usernameSpan').text('Username cannot contain spaces.').css('color', 'red');
                    usernameValidation.equals = false;
                } else if (data.exists) {
                    $('#register-button').prop('disabled', true);
                    $('#register-button').css({
                        'background-color': '#ff7f6e',
                        'color': 'black'
                    });
                    $('#username').css('background-color', '#ffc0b8');
                    $('#usernameSpan').text('Username has been taken.').css('color', 'red');
                    usernameValidation.equals = false;
                } else {
                    $('#register-button').prop('disabled', false);
                    $('#username').css('background-color', '#d7ffb8');
                    $('#register-button').css({
                        'background-color': '#ff7f6e',
                        'color': 'black'
                    });
                    $('#usernameSpan').text('Username is suitable.').css('color', 'green');
                    usernameValidation.equals = true;
                    checkValidation();
                }
            }
        });
    });

    $('#password').on('input', function() { // PASSWORD VALIDATION
        var password = $('#password').val();
        if (password.length == 0) {
            $('#register-button').prop('disabled', true);
            $('#register-button').css({
                'background-color': '#ff7f6e',
                'color': 'black'
            });
        }

        if (password.length < 8) { // PASSWORD LENGTH VALIDATION
            $('#passwordSpan1').text('Password must be at least 8 characters long.').css('color', 'red');
        } else {
            $('#passwordSpan1').text('');
            $('#password').css('background-color', '');
            $('#register-button').css({
                'background-color': '',
                'color': ''
            });
        }
        
        if (!/[A-Z]/.test(password)) { // UPPERCASE LETTER VALIDATION
            $('#passwordSpan2').text('Password must include at least 1 uppercase letter.').css('color', 'red');
        } else {
            $('#passwordSpan2').text('');
            $('#password').css('background-color', '');
            $('#register-button').css({
                'background-color': '',
                'color': ''
            });
        }
        
        if (!/[^a-zA-Z0-9]/.test(password)) { // SYMBOL VALIDATION
            $('#passwordSpan3').text('Password must include at least 1 symbol.').css('color', 'red');
        } else {
            $('#passwordSpan3').text('');
            $('#password').css('background-color', '');
            $('#register-button').css({
                'background-color': '',
                'color': ''
            });
        }

        if (password.length >= 8 && /[^a-zA-Z0-9]/.test(password) && /[A-Z]/.test(password)) { // IF ALL CORRECT
            $('#password').css('background-color', '#d7ffb8');
            $('#register-button').css({
                'background-color': '#ff7f6e',
                'color': 'black'
            });
            $('#passwordSpan1').text('Password is suitable.').css('color', 'green');
            passwordValidation.equals = true;
            checkValidation();
        } else {
            passwordValidation.equals = false;
            checkValidation();
        }

        if (password.length < 8 || !/[A-Z]/.test(password) || !/[^a-zA-Z0-9]/.test(password)) {
            $('#register-button').prop('disabled', true);
            $('#register-button').css({
                'background-color': '#ff7f6e',
                'color': 'black'
            });
            $('#password').css('background-color', '#ffc0b8');
        }

        if (password.length == 0) {
            $('#register-button').prop('disabled', true);
            $('#passwordSpan').text('');
            $('#password').css('background-color', '');
            $('#register-button').css({
                'background-color': '#ff7f6e',
                'color': 'black'
            });
            $('#passwordSpan1').text('');
            $('#passwordSpan2').text('');
            $('#passwordSpan3').text('');
        }
    });

    $('button[type="reset"]').on('click', function() {
        $('#usernameSpan').text('');
        $('#passwordSpan1').text('');
        $('#passwordSpan2').text('');
        $('#passwordSpan3').text('');
        $('#username').css('background-color', '');
        $('#password').css('background-color', '');
        $('#register-button').css({
            'background-color': '#ff7f6e',
            'color': 'black'
        });
    });
});