api = "https://picoroom.fly.dev/"
room = 1
screenwidth = 460
screenheight = 260
midx = 460 / 2
midy = 260 / 2
roomwidth = 400
roomheight = 200
px = midx
py = midy
crowd = {}
userid = sub("" .. rnd(), 3)
usersprite = 0
usercolor1 = 13
usercolor2 = 31

updatecor = nil
movecor = nil
lastroomfetch = nil

function _init()
  room = 31

  updatecor = cocreate(function()
    while true do
      updateRoom(room)
      yield()
    end
  end)
end

function _draw()
  cls()
  drawRoom()
  drawCrowd()
  drawUser()
  
  print(roomdatafetch)
  --print(opUsermove())
  --print(px .. ", " .. py .. " ; " .. (px+16) .. ", " .. (py+8) .. ", " .. ( (px-midx)*(px-midx) / ((roomwidth / 2)*(roomwidth / 2)) ) )
end

function _update()
  moveUser()

  if updatecor and costatus(updatecor) != "dead" then
    coresume(updatecor)
  end
  
  if movecor and costatus(movecor) != "dead" then
    coresume(movecor)
  end
end

function getState()
  local state = {
    t = t(),
    px = px,
    py = py,
  }
  return state
end

function move(dx, dy)
  px = px + dx
  py = py + dy
end

function drawRoom()
  local midy = 260 / 2
  local midx = 460 / 2
  local height = 200
  local width = 400
  oval(midx - width / 2, midy - height / 2,
       midx + width / 2, midy + height / 2,
       room)
end

function drawCrowd()
  for i = 1, #crowd do
    local user = crowd[i]
    pal(7, user.c1)
    pal(6, user.c2)
    spr(user.s, user.x, user.y)
  end
end

function drawUser()
  pal(7, usercolor1)
  pal(6, usercolor2)
  spr(usersprite, px, py)
end

function moveUser()
  local dx = 0
  local dy = 0
  if btnp(0) then
    dx -= 16
  elseif btnp(1) then
    dx += 16
  elseif btnp(2) then
    dy -= 8
  elseif btnp(3) then
    dy += 8
  end
  
  if inRoom(px + dx, py + dy) and not (dx == 0 and dy == 0) then
    px = px + dx
    py = py + dy


  movecor = cocreate(function()
    local op = opUsermove()
    lastroomfetch = fetch(api .. "room/" .. room .. "?" .. op)
    local roomdata = unpod(lastroomfetch)
    for i = 1,#roomdata.users do
      if roomdata.users[i].id == userid then
        table.remove(roomdata.users, i)
      end
    end
    crowd = roomdata.users
  end)
  end
end

function opUsermove()
  return userid .. "," .. usersprite .. "," .. usercolor1 .. "," ..
    usercolor2 .. "," .. px .. "," .. py
end

function updateRoom(roomId)
  lastroomfetch = fetch(api .. "room/" .. roomId)
  local roomdata = unpod(lastroomfetch)
  for i = 1,#roomdata.users do
    if roomdata.users[i].id == userid then
      table.remove(roomdata.users, i)
    end
  end
  crowd = roomdata.users
end

function inOval(x, y, cx, cy, rx, ry)
  return ( (x-cx)*(x-cx) / (rx*rx) + (y-cy)*(y-cy) / (ry*ry) ) < 1
end

function inRoom(x, y)
  return inOval(x + 8, y + 8, midx, midy, (roomwidth + 16) / 2, roomheight / 2)
end
