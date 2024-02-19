<div align="center">
 <img src="https://imgur.com/WXEqVqq.png" width="40%">
</div>

# Photo Party

Photo Party is an application for shared photos of your party on a big screen in real time.



## Tech

<div align="left">
<img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/html5/html5-original-wordmark.svg" alt="html5" width="40" height="40"/>
<img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/css3/css3-original-wordmark.svg" alt="css3" width="40" height="40"/> 
<img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/javascript/javascript-original.svg" alt="javascript" width="40" height="40"/>
<img src="https://static-00.iconduck.com/assets.00/node-js-icon-454x512-nztofx17.png" alt="nodejs" width="35" height="40"/>
<img src="https://www.logo.wine/a/logo/MySQL/MySQL-Logo.wine.svg" alt="bdd" width="80" height="40"/>
<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Visual_Studio_Code_1.35_icon.svg/1200px-Visual_Studio_Code_1.35_icon.svg.png" alt="javascript" width="40" height="40"/>
</div>

## Installation

Install Photo Party with npm

1) 
```bash
git clone the repo
```

2)
```bash
cd ./Photo-Party
```

3) 
```bash
duplicate and rename the ".env-example" > ".env"
```

4) 
```bash
npm install
```

5)  
```bash
unzip, import and deploy database of "template database.zip" in localhost
```

6) 
```bash
npm run server
```

7) In Webbrowser go to 
```bash 
player => localhost:5000/ 
admin => localhost:5000/admin
projector => localhost:5000/projecteur
```


## Shema

### Architecture

![img](https://i.imgur.com/ZqRYUfC.png)

### Sequence Diagram

![Logo](https://i.imgur.com/rutyvRh.png)


### Mermaid Diagram theme :
```json
{
  "theme": "base",
  "themeVariables": {
    "primaryColor": "#3C41FF",
    "actorTextColor": "#ffff",
    "primaryTextColor": "#000470",
    "secondaryTextColor": "#FF0000",
    "primaryBorderColor": "#000",
    "lineColor": "#000",
    "secondaryColor": "#ffffff",
    "tertiaryColor": "#000"
  }
}

```

## EndPoint

### Client :

#### Connection :

```bash
  GET /
```


#### Send data :

```bash
  POST /importingFile
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `image`      | `blob` | Image UPLOAD |
| `comment`      | `text` | text UPLOAD |
| `email`      | `text` | email of user |
| `nom`      | `text` | username of user |

### Projector :

_Establish a WebSocket connection_

#### Connection :
```bash
  GET /projecteur
```

### Admin :

_Establish a WebSocket connection_

#### Connection :
```bash
  GET /admin
```

#### Admin Pannel :
```bash
  POST /administration
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `nom`      | `text` | Admin Username |
| `mdp`      | `text` | Admin Password |


#### Admin Pannel Parameter : 
```bash
  POST /adminParameter
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `image1isChange`   | `bool` | Testing Variable |
| `image2isChange` | `bool` | Testing Variable |
| `comeToParameter` | `bool` | Testing Variable |
| `nom`     | `text` | Admin Username |
| `mdp`     | `text` | Admin Password |


## Color Reference

| Color             | Hex                                                                |
| ----------------- | ------------------------------------------------------------------ |
| Primary Color | ![#3C41FF](https://via.placeholder.com/60/3C41FF?text=+) #3C41FF |
| Black | ![#000](https://via.placeholder.com/60/000?text=+) #000 |
| White | ![#fff](https://via.placeholder.com/60/fff?text=+) #fff |

## Logo
 <img src="https://imgur.com/WXEqVqq.png" width="50%" margin="auto">

## Features

- Remove french words


