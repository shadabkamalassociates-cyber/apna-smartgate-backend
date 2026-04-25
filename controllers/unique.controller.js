const { client } = require("../config/client");
const { generateSmartGateId } = require("./common/uniqueId");

const generateUniqueId = async (req,res) => {
    try {
        const { role,Id } = req.body;
        if(!role){
            return res.status(400).json({
                success: false,
                message: "Role is required"
            });
        }
        if(!Id){
            return res.status(400).json({
                success: false,
                message: "ID is required"
            });
        }
        const id = generateSmartGateId(role);
    
        const query = `UPDATE admins SET mygate_id = $1 WHERE id = $2`;
        const result = await client.query(query, [id,Id]);
      
        res.status(200).json({
            success: true,
            message: "Unique ID generated successfully",
            data:result.rows[0]
        });
        console.log(result,"++++++++++++++++++++++++")
    } catch (error) {
      
        res.status(500).json({
            success: false,
            message: "Failed to generate unique ID",
            error: error.message
        });
    }
}

module.exports = { generateUniqueId };