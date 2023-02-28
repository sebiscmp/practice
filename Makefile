# MakeFile to deploy Solar info syste,
# server using Python Microservice
# For MATH318 Software Development
# Required setup commands:
#sudo mkdir /var/www/html/solar
#sudo chown -R ubuntu:www-data /var/www/html/solar

all: PutHTML

PutHTML:
	cp solar.html /var/www/html/practice/
	cp solar.css /var/www/html/practice/
	cp solar.js /var/www/html/practice/

	echo "Current contents of your HTML directory: "
	ls -l /var/www/html/solar

