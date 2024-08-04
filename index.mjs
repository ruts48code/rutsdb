import random from "crypto-random";
import mysql from "mysql";

export const randomArray = async (d) => {
  return new Promise(async (resolve) => {
    const o = [];
    const d2 = [...d];
    while (d2.length != 0) {
      const p = await randomInt(d2.length);
      o.push(d2.splice(p, 1)[0]);
    }
    resolve(o);
  });
};

export const randomInt = async (a) => {
  return new Promise(async (resolve) => {
    const b = random.value();
    const o = Math.floor(b * a);
    resolve(o);
  });
};

export const parseDatabaseUrl = async (url) => {
  return new Promise(async (resolve) => {
    const regex = /mysql:\/\/(.*):(.*)@tcp\((.*)\):(.*)\/(.*)/;
    const matches = url.match(regex);

    if (!matches) {
      resolve({});
    } else {
      resolve({
        host: matches[3],
        port: matches[4],
        user: matches[1],
        password: matches[2],
        database: matches[5],
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        acquireTimeout: 10000,
      });
    }
  });
};

export const queryDB = async (dbs, query, items) => {
  return new Promise(async (resolve) => {
    let pc = mysql.createPoolCluster({
      removeNodeErrorCount: 1,
      defaultSelector: "RANDOM",
    });
    for (let db of dbs) {
      pc.add(await parseDatabaseUrl(db));
    }
    pc.getConnection(async (err, connection) => {
      if (err) {
        resolve({
          status: "connection",
        });
      } else {
        connection.query(query, items, async (err2, results) => {
          if (err2) {
            resolve({
              status: "query",
            });
          } else {
            pc.end(async (err3) => {
              if (err3) {
                resolve({
                  status: "disconnect",
                });
              } else {
                resolve({
                  status: "ok",
                  results: results,
                });
              }
            });
          }
        });
      }
    });
  });
};
