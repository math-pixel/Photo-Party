 
module.exports = {

    /**
     * 
     * @param {String} table 
     * @param {String} value type value like *
     * @param {String} condition rowname = value
     * @returns 
     */
    selectQuery: function(table, value,  condition = 1){

        return `SELECT ${value} FROM ${table} WHERE ${condition}`

        // con.connect(function(err) {if (err) throw err;});
        // con.query(query, function (err, result, fields) {
        //     if (err) throw err;
        //     // console.log(result[0]);
        // });
        // con.end()
    },
    /**
     * 
     * @param {*} table 
     * @param {*} value 
     * @param {*} rowName 
     * @returns 
     */
    insertQuery: function(table, rowName, value ){

        return `INSERT INTO ${table} (${rowName}) VALUES (${value})`

    },

    /**
     * 
     * @param {*} table 
     * @param {*} condition 
     * @returns 
     */
    deleteQuery: function(table, condition){

        return `DELETE FROM ${table} WHERE ${condition}`

    },

    /**
     * 
     * @param {*} table 
     * @param {*} valeurEqualValue 
     * @param {*} condition 
     * @returns 
     */
    updateQuery: function(table, valeurEqualValue, condition){
        
        return `UPDATE ${table} SET ${valeurEqualValue} WHERE ${condition}`
    },


}



