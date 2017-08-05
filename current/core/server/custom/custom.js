var bodyParser = require('body-parser');
var mailer = require("nodemailer");
var customConfig = require("./custom-config");

var db = require("./custom-db");

module.exports = function(parentApp) {
    
    var urlencodedParser = bodyParser.urlencoded({ extended: false })


    parentApp.get('/contact', function(req, res) {
        
        var subject = req.query['subject'];

        var model = {
            subject: subject,
            isRequest: !!subject
        };

        res.render('custom/contact', model);
        
    })

    parentApp.post('/contact', urlencodedParser, function(req, res) {
        
        var subject = req.body['subject'];
        var body = req.body['body'];
        var email = req.body['email'];
        var name = req.body['name'];
        var company = req.body['company'];
        var isRequest = req.body['isRequest'];

        var model = {
            subject: subject,
            body: body,
            email: email,
            name: name,
            company: company,
            isRequest: isRequest
        };

        if (!body || !name || !email) {
            model.hasValidationError = true;
            res.render('custom/contact', model);
            return;
        }

        db.get(
            "select * from readers where email = ?",
            email,
            function(err, row) {
                if (!row) {
                    db.run(
                        "INSERT INTO readers(email,date,notify) values(?, ?, ?)",
                        email,
                        new Date().toISOString(),
                        1);
                }
                else {
                    db.run(
                        "update readers set date = ?, notify = ? where email = ?",
                        new Date().toISOString(),
                        0,
                        email);
                }
            }
        );


        

        


        var smtpTransport = mailer.createTransport("SMTP", customConfig.smtpConfig);

        var text = "Name: " + name + "\n";
        text += "Email: " + email + "\n";
        if (company) text += "Company: " + company + "\n";
        text += '\n';
        text += body;

        var mail = {
            from: "manfred.steyer@gmx.net",
            to: "manfred.steyer@gmx.net",
            subject: "[Anfrage] " + ( subject || 'Anfrage von Website' ),
            text: text
        }

        smtpTransport.sendMail(mail, function(error, response){
            if(error){
                console.log(error);
                model.hasSendError = true;
                res.render('custom/contact', model);
            }
            else {
                model.isSuccess = true;
                res.render('custom/contact', model);
            }

            smtpTransport.close();
        });

    });


}