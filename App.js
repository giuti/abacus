import React from 'react';
import { StyleSheet, Text, View, Button, ActivityIndicator, FlatList } from 'react-native';
import { createStackNavigator, createAppContainer } from 'react-navigation';

class HomeScreen extends React.Component {
  render() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Home Screen</Text>
        <Button
          title="Go to Matches"
          onPress={() => this.props.navigation.navigate('Matches')}
        />
      </View>
    );
  }
}

class MatchesScreen extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      teams: [],
      isMatchesLoading: true,
      isStandingsLoading: true
    }
  }

  async getStandings() {
    try {
      const response = await fetch('https://abacus-api.herokuapp.com/api/teams/');
      const responseJson = await response.json();
      var teams = [];
      for (var i = 0; i < responseJson.data.length; i++) {
        teams.push({
          position: responseJson.data[i].position,
          id: responseJson.data[i].teamId,
          name: responseJson.data[i].name,
          crest: responseJson.data[i].crest,
          played: responseJson.data[i].played,
          won: responseJson.data[i].won,
          draw: responseJson.data[i].draw,
          lost: responseJson.data[i].lost,
          points: responseJson.data[i].points,
          goalsFor: responseJson.data[i].goalsFor,
          goalsAgainst: responseJson.data[i].goalsAgainst,
          goalsDiff: responseJson.data[i].goalsDiff
        });
      }
      this.setState({
        isStandingsLoading: false,
        standingsData: responseJson,
        teams: teams,
      }, function () {
      });
    }
    catch (error) {
      console.error(error);
    }
  }

  async getMatches() {
    try {
      const response = await fetch('https://abacus-api.herokuapp.com/api/matches/');
      const responseJson = await response.json();
      var matches = [];
      for (var i = 0; i < responseJson.data.length; i++) {
        if (responseJson.data[i].status != 'FINISHED'){
          matches.push({
            awayTeamGoals: responseJson.data[i].awayTeamGoals,
            awayTeamId: responseJson.data[i].awayTeamId,
            awayTeamName: responseJson.data[i].awayTeamName,
            homeTeamGoals: responseJson.data[i].homeTeamGoals,
            homeTeamId: responseJson.data[i].homeTeamId,
            homeTeamName: responseJson.data[i].homeTeamName,
            id: responseJson.data[i].id,
            matchId: responseJson.data[i].matchId,
            matchday: responseJson.data[i].matchday,
            status: responseJson.data[i].status,
            utcDate: responseJson.data[i].utcDate
          });
        }
      }
      this.setState({
        isMatchesLoading: false,
        matchesData: responseJson,
        matches: matches
      }, function () {
      });
    }
    catch (error) {
      console.error(error);
    }
  }

  componentDidMount(){
    this.getStandings();
    this.getMatches();
  }

  render() {
    if(this.state.isMatchesLoading || this.state.isStandingsLoading){
      return(
        <View style={{flex: 1, padding: 20}}>
          <ActivityIndicator/>
        </View>
      )
    }

    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <FlatList
          data={this.state.matches.sort((a, b) => (a.matchday - b.matchday))}
          renderItem={({item}) =>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text>
                {item.homeTeamName}{item.homeTeamGoals}{item.awayTeamGoals}{item.awayTeamName}
              </Text>
            </View>
          }
          keyExtractor={(item, index) => 'match_'+item.id}
        />
        <Button
          title="Calculate"
          onPress={() => this.props.navigation.navigate('CalculatedTable', {teams: this.state.teams})}
        />
      </View>
    );
  }
}

class CalculatedTableScreen extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      teams: this.props.navigation.getParam('teams', []),
      orderedTeams: []
    }
  }

  compare(a, b) {
    return b.points - a.points
  }

  sortTable() {
    var teams = this.state.teams
    var orderedTeams = teams.sort(this.compare)
    this.setState({
      orderedTeams: orderedTeams
    }, function(){

    });
  }

  componentDidMount(){
    this.sortTable();
  }

  render() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Calculated Table Screen</Text>
        <FlatList
          data={this.state.teams}
          renderItem={({item}) =>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text>
                {item.name}
              </Text>
            </View>
          }
          keyExtractor={(item, index) => 'team_'+item.id}
        />
      </View>
    );
  }
}

const RootStack = createStackNavigator(
  {
    Home: HomeScreen,
    Matches: MatchesScreen,
    CalculatedTable: CalculatedTableScreen,
  },
  {
    initialRouteName: 'Home',
  }
);

export default createAppContainer(RootStack);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
