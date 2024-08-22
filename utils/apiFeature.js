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

    filter() {
        const queryObj = { ...this.queryString };
        const excludedFields = ["page", "sort", "limit", "fields"];
        excludedFields.forEach((el) => delete queryObj[el]);
        // Advanced filtering
        for (let field in queryObj) {
            if (
                (typeof queryObj[field] === "string" ||
                    queryObj[field] instanceof String) &&
                queryObj[field].split("||").length > 1
            ) {
                queryObj[field] = { $in: queryObj[field].split("||") };
            }
        }
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
        this.filter = JSON.parse(queryStr);
        return this;
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
