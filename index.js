const http = require("http");
const port = process.env.PORT || 8080;
const TIMEOUT_THRESHOLD = 60000;

const WIDTH = 460;
const HEIGHT = 230;
const ROOM_CX = WIDTH / 2;
const ROOM_CY = HEIGHT / 2;
const ROOM_RX = 200;
const ROOM_RY = 100;

const data = {
   1: [],  2: [],  3: [],  4: [],  5: [],  6: [],  7: [],  8: [],  9: [], 10: [], 11: [], 12: [], 13: [], 14: [], 15: [], 16: [],
  17: [], 18: [], 19: [], 20: [], 21: [], 22: [], 23: [], 24: [], 25: [], 26: [], 27: [], 28: [], 29: [], 30: [], 31: [],
};

function renderRoomData(room) {
  let userList = room.map((user) => `{id="${user.id}",t=${Math.floor(user.lastUpdateTime / 1000)},s=${user.sprite},x=${user.x},y=${user.y},c1=${user.color1},c2=${user.color2}}`).join(",");
  return `{users={${userList}}}`;
}

function removeOldUsers(now, threshold, users) {
  return users.filter((user) => (now - user.lastUpdateTime) < threshold);
}

function renderClientError(res, message) {
  res.writeHead(400);
  res.write(message);
  res.end();
}

function range(min, max) {
  return {
    contains: function(n) {
      return n >= min && n <= max;
    },
  };
}

function inOval(x, y, cx, cy, rx, ry) {
  return (Math.pow(x - cx, 2) / Math.pow(rx, 2) + Math.pow(y - cy, 2) / Math.pow(ry, 2)) < 1;
}

function inRoom(x, y, cx, cy, rx, ry) {
  // Special fuzzing math to keep the sprite visually inside the room.
  return inOval(x + 8, y + 8, ROOM_CX, ROOM_CY, ROOM_RX + 8, ROOM_RY)
}


http.createServer((req, res) => {
  const [path, query] = req.url.split("?");
  const [obj, id] = path.split("/").filter((segment) => !!segment);
  const roomId = +id;

  console.log(decodeURIComponent(req.url));

  if (obj !== "room" || roomId > 31 || roomId < 1) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.write("Not found");
    res.end();
    return;
  }

  if (query) {
    const queryParts = decodeURIComponent(query).split(",");
    if (queryParts.length < 6) {
      return renderClientError(res, "Update data is missing pieces. Expected id,sprite,color1,color2,x,y");
    }
    const [userId, sprite, color1, color2, x, y] = queryParts;
    if (userId.length > 24) {
      return renderClientError(res, "ID too long: " + userId);
    }
    if (!range(0, 4).contains(+sprite)) {
      return renderClientError(res, "sprite must be within 0 and 4");
    }
    if (!range(1, 31).contains(+color1)) {
      return renderClientError(res, "color1 must be within 1 and 31");
    }
    if (!range(1, 31).contains(+color2)) {
      return renderClientError(res, "color2 must be within 1 and 31");
    }
    if (!inRoom(+x, +y)) {
      return renderClientError(res, "x, y must be inside the room");
    }

    const newUser = {
      id: userId,
      lastUpdateTime: Date.now(),
      sprite: +sprite,
      color1: +color1,
      color2: +color2,
      x: +x,
      y: +y,
    };
    let updated = false;
    const updatedUsers = (data[roomId] || []).map((user) => {
      if (user.id === newUser.id) {
        updated = true;
        return newUser;
      } else {
        return user;
      }
    });
    if (!updated) {
      updatedUsers.push(newUser);
    }
    data[roomId] = updatedUsers;
  }

  data[roomId] = removeOldUsers(Date.now(), TIMEOUT_THRESHOLD, data[roomId] || []);

  // const data = `{room=${id},users=[{s=1,x=26,y=26}]}`;
  const roomData = renderRoomData(data[roomId] || []);
  // res.write(Buffer.from(data).toString("base64"));
  // res.writeHead(200, { 'Content-Type': 'charset=utf-8; application/pod' });
  res.write(roomData);
  res.end();
}).listen(port);

console.log(`Listening on ${port}`);
