const { ObjectId } = require("mongodb");

const returnFilterByFieldQuery = (logger, filterArray) => {
  return new Promise(async (resolve, reject) => {
    try {
      let matchCondition = {};
      for (let obj of filterArray) {
        if (obj.filter == "IS") {
          if (obj.type == "Owner" || obj.type == "Lookup") {
            matchCondition[obj.field] = new ObjectId(obj.data);
          } else if (obj.type == "date") {
            var givenDate = new Date(obj.data);
            var dateBefore = new Date(givenDate);
            var dateAfter = new Date(givenDate);

            // Get the date before by subtracting one day from the given date
            dateBefore.setDate(dateBefore.getDate() - 1);

            // Get the date after by adding one day to the given date
            dateAfter.setDate(dateAfter.getDate() + 1);

            const formatDate = date => {
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            };

            const formatDateWithTime = date => {
              return date.toISOString().split('T')[0] + "T00:00:00Z";
            };

            var GivenDate = formatDate(givenDate);
            var beforeDate = formatDateWithTime(dateBefore);
            var afterDate = formatDateWithTime(dateAfter);
            obj.data = { "$gte": new Date(beforeDate.toString()), "$lt": new Date(afterDate.toString()) };

            matchCondition[obj.field] = obj.data;

          } else {
            obj.data = { $regex: obj.data, $options: "i" };
            matchCondition[obj.field] = obj.data;
          }
        }
        if (obj.filter == "IS_NOT") {
          if (obj.type == "Owner" || obj.type == "Lookup") {
            matchCondition[obj.field] = { $ne: new ObjectId(obj.data) };
          } else {
            matchCondition[obj.field] = { $ne: obj.data };
          }
        }
        if (obj.filter == "CONTAINS") {
          // Escape any special characters in the pattern
          var pattern = obj.data.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          // Create a case-insensitive regex
          var regex = new RegExp(pattern, "i");
          matchCondition[obj.field] = { $regex: regex };
        }

        if (obj.filter == "DOES_NOT_CONTAINS") {
          // Escape any special characters in the pattern
          var pattern = obj.data.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          // Create a case-insensitive regex
          var regex = new RegExp(pattern, "i");
          matchCondition[obj.field] = { $not: { $regex: regex } };
        }

        if (obj.filter == "END_WITH") {
          var pattern = obj.data; // Assuming obj.data contains the dynamic value
          // Escape any special characters in the pattern
          pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          var regex = new RegExp(pattern + "$", "i"); // Construct the regex with the dynamic value and case-insensitive flag
          matchCondition[obj.field] = { $regex: regex };
        }
        if (obj.filter == "START_WITH") {
          var pattern = obj.data; // Assuming obj.data contains the dynamic value
          // Escape any special characters in the pattern
          pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          var regex = new RegExp("^" + pattern, "i"); // Construct the regex with the dynamic value and case-insensitive flag
          matchCondition[obj.field] = { $regex: regex };
        }

        if (obj.filter == "IS_EMPTY") {
          matchCondition.$or = [
            { [obj.field]: { $exists: false } },
            { [obj.field]: "" }
          ];
        }
        if (obj.filter == "IS_NOT_EMPTY") {
          matchCondition[obj.field] = { $exists: true, $ne: "" };
        }
        if (obj.filter == "REGEX") {
          obj.data = { $regex: obj.data, $options: "i" };
          matchCondition[obj.field] = obj.data;
        }
        if (obj.filter == "<") {
          matchCondition[obj.field] = { $lt: obj.data };
        }
        if (obj.filter == ">") {
          matchCondition[obj.field] = { $gt: obj.data };
        }
        if (obj.filter == "<=") {
          matchCondition[obj.field] = { $lte: obj.data };
        }
        if (obj.filter == ">=") {
          matchCondition[obj.field] = { $gte: obj.data };
        }
        if (obj.filter == "=") {
          matchCondition[obj.field] = { $eq: obj.data };
        }
        if (obj.filter == "!=") {
          matchCondition[obj.field] = { $ne: obj.data };
        }
      }
      resolve(matchCondition);
    } catch (error) {
      //console.log(error)
      // logger.error(`Error in returnFilterByFieldQuery` + error);
      reject(error);
    }
  });
};

const returnFilterButton = (logger, filterButton, userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      let matchCondition = {};
      if (filterButton == "Read") {
        matchCondition["read"] = true;
      }
      if (filterButton == "UnRead") {
        matchCondition["read"] = { $ne: true };
      }
      if (filterButton == "My") {
        matchCondition["LeadsOwnerId"] = new ObjectId(userId);
      }
      if (filterButton == "MyConvert") {
        matchCondition["LeadsOwnerId"] = new ObjectId(userId);
        matchCondition["status"] = 0;
      }
      if (filterButton == "Convert") {
        matchCondition["status"] = 0;
      }
      if (filterButton == "Today") {
        const toDate = new Date();
        const fromDate = new Date();

        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(0, 0, 0, 0);

        toDate.setDate(toDate.getDate() + 1);
        matchCondition["$and"] = [
          { createdTime: { $gte: fromDate } },
          { createdTime: { $lte: toDate } },
        ];
      }
      if (filterButton == "Tuch") {
        matchCondition["tuch"] = true;
      }
      if (filterButton == "UnTuch") {
        matchCondition["tuch"] = { $ne: true };
      } else {
        matchCondition["status"] = { $ne: 0 };
      }
      resolve(matchCondition);
    } catch (error) {
      logger.error(`Error in returnFilterButton ${error}`);
      reject(error);
    }
  });
};

// Incoming Data Validation Filter With Equality Opretors
const returnFilterByEquality = (logger, filterArray, body) => {
  return new Promise(async (resolve, reject) => {
    try {
      var conditionArr = [];

      for (let obj of filterArray) {
        var { field, data, filter } = obj;
        if (filter == "IS") {
          conditionArr.push(body[field] == data);
        }
        if (filter == "IS_NOT") {
          conditionArr.push(body[field] != data);
        }
        if (filter == "CONTAINS") {
          data = new RegExp(data, "i");
          conditionArr.push(data.test(body[field]));
        }
        if (filter == "DOES_NOT_CONTAINS") {
          data = new RegExp(data, "i");
          conditionArr.push(!data.test(body[field]));
        }
        if (filter == "END_WITH") {
          data = new RegExp(data + "$", "i");
          conditionArr.push(data.test(body[field]));
        }
        if (filter === "START_WITH") {
          data = new RegExp("^" + data, "i");
          conditionArr.push(data.test(body[field]));
        }
        if (filter === "IS_EMPTY") {
          conditionArr.push(body[field] === "" || body[field] === null);
        }
        if (filter === "IS_NOT_EMPTY") {
          conditionArr.push(body[field] !== "" && body[field] !== null);
        }
      }
      resolve(conditionArr);
    } catch (error) {
      //console.log("returnFilterByEquality-Error-->", error);
      logger.error(`Error in returnFilterByEquality ${error}`);
      reject(error);
    }
  });
};

module.exports = {
  returnFilterByFieldQuery,
  returnFilterButton,
  returnFilterByEquality,
};
