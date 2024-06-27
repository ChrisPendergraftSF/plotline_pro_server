const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const path = require("path");
const app = express();
const cloudinary = require("cloudinary").v2;

var Backendless = require("backendless");
const APP_ID = "3398BFA4-37F0-C2F1-FF49-8C94D7254800";
const API_KEY = "6FD75662-2CDA-4B89-8783-D26F6CA5B4EB";
Backendless.serverURL = "https://api.backendless.com";
Backendless.initApp(APP_ID, API_KEY);

const initialState = {
  loading: true,
  message: "",
  error: null,
};
const CLOUDINARY_URL =
  "cloudinary://834223293181591:SCHST1KT77FfY0gI3CvpMlmDfJ8@dx9n7wslf";
cloudinary.config({
  cloud_name: "dx9n7wslf",
  api_key: "834223293181591",
  api_secret: "SCHST1KT77FfY0gI3CvpMlmDfJ8",
});
app.use(bodyParser.json());

app.post("/api/uploader", function (req, res) {
  let file = req.body.reference;

  cloudinary.uploader.upload(file, function (error, result) {
    console.log(result, error);

    if (result) {
      res.send(result);
    }
    if (error) {
      console.log("error on image upload", error);
    }
  });
});

app.post("/api/login", function (req, res) {
  let email = req.body.email;
  let password = req.body.password;
  let stayLoggedIn = true;

  if (
    !Backendless.UserService.login(email, password, true)
      .then(function (loggedInUser) {
        return res.send(loggedInUser);
      })
      .catch(function (error) {
        console.log("nope, cant log in", error);
      })
  ) {
  }
});
app.get("/api/getuser", function (req, res) {
  Backendless.UserService.getCurrentUser()
    .then(function (user) {
      console.log("get user", user);
      return res.json(user);
    })
    .catch(function (error) {
      console.log("could not get current user", error);
    });
});
//Register- create user
app.post("/api/register", function (req, res) {
  console.log(req.body);

  var user = new Backendless.User();
  user.email = req.body.email;
  user.password = req.body.password;
  user.name = req.body.name;

  console.log(user);

  Backendless.UserService.register(user).then((obj) => {
    console.log("response register", obj);

    if (obj) {
      return res.send(obj);
    }
  });
});

//update user
app.post("/api/user/", function (req, res) {
  var user = new Backendless.User();
  user["objectId"] = req.body.objectId;
  user["name"] = req.body.name;
  user["email"] = req.body.email;
  user["password"] = req.body.password;

  Backendless.UserService.update(user)
    .then(function (user) {
      if (user.objectId) {
        res.redirect("/profile/edit");
      } else {
        console.log("Error saving user update..inside", user);
      }
    })
    .catch(function (error) {
      console.log("Error saving user update", error);
    });
});
//create new project
app.post("/api/project", function (req, res) {
  console.log("req", req.body);
  let project = {};
  project.title = req.body.title;
  project.ownerId = req.body.ownerId;
  project.timeline_type = req.body.timeline_type;
  project.imgurl = req.body.imgurl;

  Backendless.Data.of("project")
    .save(project)
    .then(function (ret) {
      console.log("ret", req.body);
      if (ret) {
        return res.send(ret);
      }
    })
    .catch(function (error) {
      console.log("error making project", error);
    });
});
app.post("/api/project_dependents/(:objectId)", function (req, res) {
  let projectPage = {};
  projectPage.characters = [];
  projectPage.locations = [];

  let currentProject = req.params.objectId;

  let whereClausdu = 'projectId="' + currentProject + '"';

  let queryBuilderdu = Backendless.DataQueryBuilder.create(whereClausdu);
  console.log("whereClausdu", whereClausdu);

  Backendless.Data.of("characters")
    .find(queryBuilderdu)
    .then(function (chars) {
      projectPage.characters = [];

      chars.map(function (value, index) {
        if (value.projectId === currentProject) {
          projectPage.characters.push(value);
        }
      });

      console.log("chars", projectPage.characters.length);
    })
    .catch(function (error) {
      console.log("error", error);
    })
    .then(function () {
      Backendless.Data.of("locations")
        .find(queryBuilderdu)
        .then(function (locs) {
          projectPage.locations = [];

          locs.map(function (value, index) {
            if (value.projectId === currentProject) {
              projectPage.locations.push(value);
            }
          });

          console.log("locations", projectPage.locations.length);
        })
        .catch(function (error) {
          console.log("error", error);
        })
        .catch(function (error) {
          console.log("error", error);
        })
        .then(function () {
          return res.json(projectPage);
        });
    });
});
app.get("/api/projects", function (req, res) {
  let projectPage = {};
  projectPage.projects = [];
  console.log("projects_____CONSTRUCTOR");

  Backendless.UserService.getCurrentUser()
    .then(function (user) {
      if (user) {
        let whereClaus = 'ownerId="' + user.objectId + '"';

        let queryBuilder = Backendless.DataQueryBuilder.create(whereClaus);

        projectPage.user = user;
        projectPage.projects = [];

        Backendless.Data.of("project")
          .find(queryBuilder)
          .then(function (response) {
            projectPage.projects = response;
            return res.json(projectPage);
          })
          .catch(function (error) {
            console.log(error);
          });
      } else {
        console.log("userLogged out");
      }
    })
    .catch(function (error) {
      console.log("could not get current user", error);
    });
});

app.post("/api/project/(:objectId)", function (req, res) {
  let d_full = {};
  let whereClaus = 'objectId="' + req.params.objectId + '"';
  let queryBuilder = Backendless.DataQueryBuilder.create();

  queryBuilder.setRelationsDepth(4);

  Backendless.Data.of("project")
    .findById(req.params.objectId, queryBuilder)
    .then(function (ret) {
      if (ret) {
        d_full.locations = [];
        d_full.characters = [];
        d_full.timelines = ret;
        d_full.timelines.messages = [];

        let whereClausdu = 'ownderId="' + ret.ownerId + '"';
        let queryBuilderdu = Backendless.DataQueryBuilder.create(whereClausdu);
        //get a collection of location for the project to use as created by the owner of the project
        Backendless.Data.of("locations")
          .find(queryBuilderdu)
          .then(function (locs) {
            if (locs) {
              d_full.locations = locs;
              //get a collection of characters for the project to use as created by the owner of the project
            } else {
              d_full.locations = [];
            }
            Backendless.Data.of("characters")
              .find(queryBuilderdu)
              .then(function (chars) {
                if (chars) {
                  chars.map(function (value, index) {
                    value.value = value.objectId;
                  });

                  d_full.characters = chars;
                } else {
                  d_full.characters = [];
                }

                let whereClausTre = 'project_id="' + req.params.objectId + '"';
                let queryBuilderTre =
                  Backendless.DataQueryBuilder.create(whereClausTre);

                queryBuilderTre.setSortBy("created ASC");
                queryBuilderTre.setPageSize(100);

                Backendless.Data.of("messages")
                  .find(queryBuilderTre)
                  .then(function (msgs) {
                    d_full.timelines.messages = msgs;

                    let whereC = 'project_id="' + req.params.objectId + '"';
                    let qB = Backendless.DataQueryBuilder.create(whereC);

                    qB.setRelationsDepth(1);
                    Backendless.Data.of("team")
                      .find(qB)
                      .then(function (team) {
                        d_full.timelines.team = team;
                        return res.json(d_full);
                      })
                      .catch(function (error) {
                        console.log("error getting team", error);
                      });
                  })
                  .catch(function (error) {
                    console.log("error getting project messages", error);
                  });
              });
          });
      }
    })
    .catch(function (error) {
      console.log(error);
    });
});
//get a projects by owner
app.get("/api/projects/(:owner_id)", function (req, res) {
  let whereClaus = "ownerId = " + req.params.owner_id;
  let queryBuilder =
    Backendless.DataQueryBuilder.create().setWhereClause(whereClaus);

  Backendless.Data.of("project")
    .find(queryBuilder)
    .then(function (ret) {
      if (ret) {
        return res.send(ret);
      }
    });
});

// create
app.post("/api/timeline/(:project_owner)", function (req, res) {
  let timeline = {};
  timeline.timline_type = req.body.timline_type;
  timeline.timeline_title = req.body.timeline_title;
  timeline.title = req.body.title;

  //save timeline to DB
  Backendless.Data.of("timelines")
    .save(timeline)
    .then(function (ret) {
      let adders = [];

      if (ret) {
        //find project and see if any other timelines exist, so we can add back, and not remove original items.
        let qB = Backendless.DataQueryBuilder.create();
        qB.setRelationsDepth(2);
        Backendless.Data.of("project")
          .findById(req.params.project_owner, qB)
          .then(function (value) {
            console.log("get project timelines", value);

            if (value.timelines) {
              value.timelines.map((val, index) => {
                const newIT = { objectId: val.objectId };
                adders.push(newIT);
              });
              console.log("get adders ", adders);
            } //could be empty; list of IDs of timelines associated with project
            let newItem = { objectId: ret.objectId };
            adders.push(newItem);
            let parentObject = { objectId: value.objectId };
            //now we add the previous return ref to the collection of ids
            //so we can set the relationship in the next
            console.log("adders", adders);

            //Added timeline, now we add the relationship to the project as a child of the timelines collection.
            Backendless.Data.of("project")
              .setRelation(parentObject, "timelines", adders)
              .then(function (val) {
                adders.map(function (item, index) {
                  let newVal = {};
                  newVal["project_order"] = index;
                  newVal["objectId"] = item.objectId;

                  Backendless.Data.of("timelines")
                    .save(newVal)
                    .then(function (val) {
                      console.log("saved order", val);
                    });
                });
              })
              .catch(function (error) {
                console.log(
                  "Server reported an error on adding timeline to project " +
                    error
                );
              });
          })
          .catch(function (error) {
            console.log(
              "Server reported an error on creating a timeline " + error
            );
          });
      }
    });
});
app.post("/api/timeline/update/(:objectId)", function (req, res) {
  let timeline = {};
  timeline.objectId = req.params.objectId;
  timeline.timeline_title = req.body.timeline_title;
  timeline.title = req.body.title;
  timeline.timeline_type = req.body.timeline_type;

  Backendless.Data.of("timelines")
    .save(timeline)
    .then(function (d_full) {
      return res.json(d_full);
    })
    .catch(function (error) {
      console.log("error updating timeline");
    });
});
//NEw character
app.post("/api/character/", function (req, res) {
  console.log("add character", req.body);
  let character = {};
  character.name = req.body.name;
  character.background = req.body.background;
  character.occupation = req.body.occupation;
  character.notes = req.body.notes;
  character.imgurl = req.body.imgurl;
  character.projectId = req.body.projectId;

  Backendless.Data.of("characters")
    .save(character)
    .then(function (char) {
      return res.json(char);
    })
    .catch(function (error) {
      console.log("error add character", error);
    });
});
//update character
app.post("/api/update/character/(:objectId)", function (req, res) {
  let character = {};
  character.objectId = req.params.objectId;
  character.name = req.body.name;
  character.backstory = req.body.backstory;
  character.occupation = req.body.occupation;
  character.notes = req.body.notes;
  character.imgurl = req.body.imgurl;

  Backendless.Data.of("timelines")
    .save(character)
    .then(function (char) {
      return res.json(char);
    })
    .catch(function (error) {
      console.log("error updating timeline");
    });
});

app.post("/api/locations", function (req, res) {
  let location = {};
  location.name = req.body.name;
  location.location_desc = req.body.backstory;
  location.imgurl = req.body.imgurl;

  Backendless.Data.of("locations")
    .save(location)
    .then(function (location) {
      return res.json(location);
    })
    .catch(function (error) {
      console.log("error creating location");
    });
});

app.post("/api/locations/update/(:objectId)", function (req, res) {
  let location = {};
  location.name = req.body.name;
  location.location_desc = req.body.backstory;
  location.objectId = req.params.objectId;
  location.imgurl = req.body.imgurl;

  Backendless.Data.of("locations")
    .save(location)
    .then(function (location) {
      return res.json(location);
    })
    .catch(function (error) {
      console.log("error creating location");
    });
});

app.post("/api/updateorder", function (req, res) {
  const ler = [];

  req.body.map(function (item) {
    let obj = {};
    obj.objectId = item.objectId;
    obj.timeline_order = item.timeline_order;
    console.log("obj", obj);

    Backendless.Data.of("plotcard")
      .save(obj)
      .then(function (item) {
        return res.json(item);
      })
      .catch(function (error) {
        console.log("error updating order");
      });
  });
});

app.post("/api/createplotcard", function (req, res) {
  let plotcard = {};
  let characters = req.body.characters;
  characters.map(function (val) {
    val = { objectId: val };
  });
  let location = req.body.location;

  plotcard.description = req.body.description;
  plotcard.point_type = req.body.point_type;
  plotcard.imgurl = req.body.imgurl;
  plotcard.timeline_order = req.body.timeline_order;
  plotcard.title = req.body.title;
  plotcard.ownerId = req.body.timelineId;

  let parentObjectId = plotcard.ownerId;

  //save new model,
  //get objectID from return
  //add relations from collection of characters
  //add relation to location

  //save plotcard to DB
  Backendless.Data.of("plotcard")
    .save(plotcard)
    .then(function (ret) {
      if (ret) {
        //find timeline and see if any other plotcard exist, so we can add back, and not remove original items.
        let parentID = ret.objectId;
        Backendless.Data.of("plotcard")
          .setRelation({ objectId: ret.objectId }, "characters", characters)
          .then(function (chars) {
            console.log("saved card, added chars");

            Backendless.Data.of("plotcard")
              .setRelation({ objectId: ret.objectId }, "location", [
                { objectId: location },
              ])
              .then(function (loc) {
                console.log("saved card, added chars & location");
                let queryBuilder = Backendless.DataQueryBuilder.create();

                queryBuilder.setRelationsDepth(4);
                Backendless.Data.of("timelines")
                  .findById(parentObjectId, queryBuilder)
                  .then(function (value) {
                    console.log("saved card, got timeline", value);

                    let adders = [];
                    value.plotcards.map(function (value) {
                      adders.push({ objectId: value.objectId });
                    });
                    let newItem = { objectId: ret.objectId };
                    adders.push({ objectId: parentID });
                    console.log("saved card, adding new card id", adders);
                    //now we add the previous return ref to the collection of ids
                    //so we can set the relationship in the next
                    let parentObject = { objectId: value.objectId };
                    //Added timeline, now we add the relationship to the project as a child of the timelines collection.
                    Backendless.Data.of("timelines")
                      .setRelation(parentObject, "plotcards", adders)
                      .then(function (val) {
                        console.log("saved card, added card to timline");
                        return res.json(val);
                      })
                      .catch(function (error) {
                        console.log(
                          "Server reported an error on adding plotcard to timeline " +
                            error
                        );
                      });
                  })
                  .catch(function (error) {
                    console.log(
                      "Server reported an error on creating a plotcard " + error
                    );
                  });
              })
              .catch(function (error) {
                console.log(
                  "Server reported an error on creating a plotcard " + error
                );
              });
          })
          .catch(function (error) {
            console.log("errrrrrr", error);
          });
      }
    });
});
app.post("/api/updateplotcard", function (req, res) {
  //updating existing card
  let chars = req.body.characters;
  let charArr = [];
  chars.map(function (val) {
    if (val.objectId != null) {
      charArr.push(val.objectId);
    } else {
      charArr.push(val.value);
    }
  });
  console.log("charArr", charArr);
  let loc = [];
  if (req.body.location.objectId) {
    loc.push(req.body.location.objectId);
  } else {
    loc.push(req.body.location[0].objectId);
  }

  console.log("loc", loc);
  let obj = {};
  obj.title = req.body.title;
  obj.description = req.body.description;
  obj.point_type = req.body.point_type;
  obj.objectId = req.body.objectId;
  obj.imgurl = req.body.imgurl;

  Backendless.Data.of("plotcard")
    .save(obj)
    .then(function (plotcard) {
      console.log("updating plotcard.....", plotcard);
      let parentObject = { objectId: plotcard.objectId };
      Backendless.Data.of("plotcard")
        .setRelation(parentObject, "characters", charArr)
        .then(function (value) {
          console.log("updating plotcard p_character.....");
          Backendless.Data.of("plotcard")
            .setRelation(parentObject, "location", loc)
            .then(function (loca) {
              console.log("updating plotcard location.....");
              return res.json(loca);
            })
            .catch(function (error) {
              console.log("error updating plotcard", error);
            });
        })
        .catch(function (error) {
          console.log("error updating character", error);
        });
    })
    .catch(function (error) {
      console.log("error updating plotcard", error);
    });
});

app.post("/api/deleteplotcard/(:objectId)", function (req, res) {
  Backendless.Data.of("plotcard")
    .remove({ objectId: req.params.objectId })
    .then(function (s) {
      if (s) {
        return res.json(s);
      }
    });
});
app.post("/api/getmsg/(:projectId)/(:timestamp)", function (req, res) {
  let project = req.params.projectId;
  let timestamp = req.params.timestamp;

  let wc = "created > " + timestamp + " and project_id ='" + project + "'";

  let dqb = Backendless.DataQueryBuilder.create().setWhereClause(wc);
  dqb.setSortBy("created ASC");

  Backendless.Data.of("messages")
    .find(dqb)
    .then(function (msgs) {
      return res.json(msgs);
    })
    .catch(function (error) {
      console.log("error getting project messages", error);
    });
});
app.post("/api/sendmsg", function (req, res) {
  let message = req.body;
  Backendless.Data.of("messages")
    .save(message)
    .then(function (msg) {
      console.log("adding msg, saved msg", msg);
      if (msg) {
        let whereClausTre = 'project_id="' + msg.project_id + '"';
        let queryBuilderTre =
          Backendless.DataQueryBuilder.create(whereClausTre);
        queryBuilderTre.setPageSize(100);
        queryBuilderTre.setSortBy("created ASC");
        Backendless.Data.of("messages")
          .find(queryBuilderTre)
          .then(function (msgs) {
            console.log(
              "added msg, got entire collection back to sync ui",
              msgs
            );
            return res.json(msgs);
          })
          .catch(function (error) {
            console.log("error getting project messages", error);
          });
      }
    })
    .catch(function (error) {
      console.log("error saving message");
    });
});

app.use(express.static("../build"));

app.get("/", (req, res) => res.send("Express on Vercel"));

app.listen(8080, function () {
  console.log("STARTING SERVER...PORT 8080");
});

