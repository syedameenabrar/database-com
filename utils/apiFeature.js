const escapeRegExp = (text) => {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

class APIFeatures {
    constructor(queryString) {
        this.queryString = queryString;
    }

    filterRegex(param) {
        let query = { ...this.queryString };
        if (!query[param]) {
            delete this.filter[param];
            return this;
        }

        if (typeof query[param] != "string") {
            query[param] = "";
        }
        const queryObj = {};
        queryObj[param] = query[param];

        this.filter = { $text: { $search: queryObj[param] }, ...this.filter }; //{ $regex: queryObj[param], $options: "i" };
        delete this.filter[param];
        return this;
    }

    orRegexFieldSearch(field, param) {
        let query = { ...this.queryString };
        if (!query[param]) {
            delete this.filter[param];
            return this;
        }
        if (typeof query[param] != "string") {
            query[param] = "";
        }
        const queryObj = {};
        queryObj[param] = query[param];
        let regex = escapeRegExp(queryObj[param]);
        const regexObject = { [field]: { $regex: regex, $options: "gi" } };

        if (!this.filter["$or"]) {
            this.filter["$or"] = [];
        }

        this.filter["$or"].push({ ...regexObject });
        delete this.filter[param];
        return this;
    }

    orRegexMultipleSearch(param) {
        let query = { ...this.queryString };
        if (!query[param]) {
            delete this.filter[param];
            return this;
        }
        let searchFilter = {};
        try {
            searchFilter = JSON.parse(query[param]);
        } catch (err) {
            searchFilter = {};
        }
        for (let field of Object.keys(searchFilter)) {
            const queryObj = {};
            queryObj[field] = searchFilter[field];
            let regex = escapeRegExp(queryObj[field]);
            const regexObject = { [field]: { $regex: regex, $options: "gi" } };
            if (!this.filter["$or"]) {
                this.filter["$or"] = [];
            }
            this.filter["$or"].push({ ...regexObject });
        }
        delete this.filter[param];
        return this;
    }

    // filter() {
    //     const queryObj = { ...this.queryString };
    //     const excludedFields = ["page", "sort", "limit", "fields"];
    //     excludedFields.forEach((el) => delete queryObj[el]);
    //     // Advanced filtering
    //     for (let field in queryObj) {
    //         if (
    //             (typeof queryObj[field] === "string" ||
    //                 queryObj[field] instanceof String) &&
    //             queryObj[field].split("||").length > 1
    //         ) {
    //             queryObj[field] = { $in: queryObj[field].split("||") };
    //         }
    //     }
    //     let queryStr = JSON.stringify(queryObj);
    //     queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    //     this.filter = JSON.parse(queryStr);
    //     return this;
    // }


    filter() {
        const queryObj = { ...this.queryString };
        const excludedFields = ["page", "sort", "limit", "fields"];
        excludedFields.forEach((el) => delete queryObj[el]);
        console.log("queryObj...++--**&",queryObj)
      
        // Date range filtering for createdAt
        if (queryObj.startDate && queryObj.endDate) {
          // Parse the date range
          const [startDay, startMonth, startYear] = queryObj.startDate.split("/");
          const [endDay, endMonth, endYear] = queryObj.endDate.split("/");
      
          // Convert to Date objects
          const startDate = new Date(`${startYear}-${startMonth}-${startDay}T00:00:00Z`);
          const endDate = new Date(`${endYear}-${endMonth}-${endDay}T23:59:59Z`);
      
          // Add date range filter to queryObj
          queryObj.createdAt = {
            $gte: startDate,
            $lte: endDate,
          };
      
          // Remove the startDate and endDate from queryObj
          delete queryObj.startDate;
          delete queryObj.endDate;
        }
      
        // Replace any query operators (gte, lte, gt, lt) with the proper MongoDB operators
        let queryStr = JSON.stringify(queryObj);
        console.log("queryStr...++--",queryStr)
        // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => $${match});
      
        // Parse the query string back into an object for the filter
        this.filter = JSON.parse(queryStr);
        
        return this;
      }
    // ?startDate=2025-10-01&endDate=2025-11-01


    convertStringToComparable(dateString) {
        const [day, month, year] = dateString.split("/");
        if (!day || !month || !year) return null;
        return `${year}${month.padStart(2, "0")}${day.padStart(2, "0")}`; // YYYYMMDD
    }
    
    populate(params) {
        if (!this.options) this.options = {};
        this.options.populate = params;
        return this;
    }

    sort() {
        if (!this.options) this.options = {};
        if (this.queryString.sort) {
            this.options.sort = this.queryString.sort.split(",").join(" ");
        } else {
            this.options.sort = "-createdAt";
        }
        return this;
    }

    limitFields(maxFilterList = null, excludeFilterList = null) {
        if (!this.options) this.options = {};
        //  To exclude list of fields
        if (excludeFilterList && !maxFilterList) {
            this.options.select = excludeFilterList.join(" ");
            return this;
        }
        if (this.queryString.fields && typeof this.queryString.fields == "string") {
            this.options.select = this.queryString.fields.split(",");
            if (maxFilterList) {
                this.options.select = this.options.select.filter((value) =>
                    maxFilterList.includes(value)
                );
            }
            this.options.select = this.options.select.join(" ");
            if (this.options.select) return this;
        }
        // If no selection is provided, then filter using maxFilterList
        if (maxFilterList) {
            this.options.select = maxFilterList.join(" ");
            return this;
        }

        this.options.select = "-__v";
        return this;
    }

    paginate() {
        if (!this.options) this.options = {};
        const page = this.queryString.page * 1 || 1;
        let limit = this.queryString.limit * 1 || 100;
        if (limit > 100) limit = 100;
        this.options = { ...this.options, page, limit };
        return this;
    }

    async exec(Model) {
        if (!this.options) this.options = { page: 1, limit: 100 };
        if (!this.filter) this.filter = {};
        this.data = await Model.paginate(this.filter, this.options);
        return this;
    }
}

module.exports = APIFeatures;
