const lamp = extendContent(LightBlock, "big-lamp", {
	update(tile){
		liquids = tile.entity.liquids;
		
		if(liquids!==undefined){
			var fullness = liquids.total()/tile.block().liquidCapacity;
			this.radius = 50+200*fullness;
			this.brightness = 0.85*fullness;
		}
	}
	
});

