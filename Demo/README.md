# Magecart's Payment Card Data-Skimming Demo
## Objective 
In this project our goal is to show how Magecart skimmer can extract payment data card from a compromised e-commerce website (victim's website) and then exfiltrate them to the drop server owned by the Magecart actors.
## Description of different application's services
In this demo we have two subprojects: 
1. Magecart skimmer embedded into a PayPage with iframe.
2. Magecart skimmer embedded into a PayPage without iframe.

In each subproject we have used five containers and a docker-compose file to run them and configure our application's services:  
The first two containers allows us to:
1. Hosting of the victims PayPage on Apache server in one container exposed on port 8099 (without iframe) and port 8096 (with iframe).
2. Hosting of the Drop server on another Apache server in one container exposed on 8066.

The last three are a centralized, logging solution that can help us quickly sort through and analyze the heavy volume of log data produced by the drop server, they allow us to run the efk stack (Elasticsearch, Fluentd, Kibana)
1. Elasticsearch container: An object store where all logs are stored, exposed on port 9200.
2. Fluentd container: Gathers logs from nodes and feeds them to Elasticsearch, exposed on port 24224.
3. Kibana container: A web UI for Elasticsearch, exposed on port 5601.

## Launching the Demo

### Requirements

| Compose file format	 | Docker Engine | Docker Compose |
| :---         | :---    | :--- |
| 3.7      | 18.06.0+   | 1.24.0 |

After installation of docker and docker-compose check their versions, just run:
```console
docker --version
Docker version 19.03.8, build afacb8b
```
```console
docker-compose --version
docker-compose version 1.24.0, build 0aa59064
```

### Run
Go to sans_iframe_paypage or iframe_paypage directory and just run:
```console
docker-compose up -d
```
After to check the state of your docker containers, run :
```console
docker-compose ps
                Name                               Command               State                              Ports                            
---------------------------------------------------------------------------------------------------------------------------------------------
drop_server_container                   docker-php-entrypoint apac ...   Up      0.0.0.0:8066->80/tcp                                        
elasticsearch_dropserver                /usr/local/bin/docker-entr ...   Up      0.0.0.0:9200->9200/tcp, 0.0.0.0:9300->9300/tcp              
kibana_dropserevr                       /usr/local/bin/kibana-docker     Up      0.0.0.0:5601->5601/tcp                                      
sans_iframe_paypage_fluentd_1           tini -- /bin/entrypoint.sh ...   Up      0.0.0.0:24224->24224/tcp, 0.0.0.0:24224->24224/udp, 5140/tcp
victime_sans_iframe_website_container   httpd-foreground                 Up      0.0.0.0:8099->443/tcp, 80/tcp                               
```
### View logs in kibana web UI
Go to your browser and access http://localhost:5601 (kibana) and https://localhost:8099 (paypage without iframe), fill checkout fields values and click on submit button. You should be able to see the Dropserver's logs (data card) in kibana's discovery tab after clicking on refresh button. By the way, if you are wondering what is this index kibana asks the fist time you access it, it is fluentd-*.