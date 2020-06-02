# Study of MageCart web skimmer in a blackbox

![Minion](TechForum2020/Images/rsz_inside-magecart-report-blog.jpg)

## Table of Contents
- [Study of MageCart web skimmer in a blackbox](#study-of-magecart-web-skimmer-in-a-blackbox)
  - [Table of Contents](#table-of-contents)
  - [1. Documentation](#1-documentation)
  - [2. General Presentation](#2-general-presentation)
    - [What does mean Magecart ?](#what-does-mean-magecart)
    


## 1. Documentation


Links to other documentation for this project:

- [Project Report](Documentation/Gathering_of_important_information.docx)
- [Inside Magecart](Documentation/RiskIQ-Flashpoint-Inside-MageCart-Report.pdf)

## 2. General Presentation

### What does mean Magecart ?

![Sample Video](TechForum2020/Teaser.mp4)

___

This project is divided into three phases :

1. Build and implement a virtual architecture that contains an infected web payment page (checkout form) with a skimming attack , a legitimate web server and a drop server (it's the server of magecart that receive skimmed credit card information).
2. Present how to embed a skimmer into a payment page and show how this skimmer can extract the payment data that has been entered into the checkout form and how it can exfiltrate them to the drop server. 
3. Stop the malicious code from executing by the implementation of the Secure Internet Payment Services (SIPS) of Worldline.
   

